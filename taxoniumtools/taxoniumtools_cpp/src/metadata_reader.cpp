#include "taxonium/metadata_reader.hpp"
#include "taxonium/string_pool.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <atomic>
#include <mutex>
#include <thread>
#include <vector>

#ifdef USE_TBB
#include <tbb/parallel_for.h>
#include <tbb/blocked_range.h>
#include <tbb/concurrent_queue.h>
#include <tbb/task_group.h>
#endif

#ifdef USE_BOOST
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#endif

namespace taxonium {

// Fast tab-splitting function to avoid stringstream overhead
std::vector<std::string> fast_split(const std::string& line, char delimiter) {
    std::vector<std::string> result;
    size_t start = 0;
    size_t end = line.find(delimiter);
    
    while (end != std::string::npos) {
        result.push_back(line.substr(start, end - start));
        start = end + 1;
        end = line.find(delimiter, start);
    }
    
    // Add the last token
    result.push_back(line.substr(start));
    return result;
}

void MetadataReader::load(const std::string& filename, 
                          const std::string& columns_str,
                          const std::string& key_column) {
    // Parse requested columns
    std::vector<std::string> requested_columns;
    if (!columns_str.empty()) {
        std::stringstream ss(columns_str);
        std::string column;
        while (std::getline(ss, column, ',')) {
            requested_columns.push_back(column);
        }
    }
    
    // Open file
    std::unique_ptr<std::istream> input;
    bool is_gzipped = filename.find(".gz") != std::string::npos;
    
    if (is_gzipped) {
#ifdef USE_BOOST
        auto* file_stream = new std::ifstream(filename, std::ios::binary);
        auto* filtering_stream = new boost::iostreams::filtering_istream();
        filtering_stream->push(boost::iostreams::gzip_decompressor());
        filtering_stream->push(*file_stream);
        input.reset(filtering_stream);
#else
        throw std::runtime_error("Gzip input requested but Boost not available");
#endif
    } else {
        input = std::make_unique<std::ifstream>(filename);
    }
    
    if (!*input) {
        throw std::runtime_error("Cannot open metadata file: " + filename);
    }
    
    // Read header
    std::string header_line;
    if (!std::getline(*input, header_line)) {
        throw std::runtime_error("Empty metadata file");
    }
    
    // Parse header using fast_split
    std::vector<std::string> headers = fast_split(header_line, '\t');
    int key_column_index = -1;
    
    for (int index = 0; index < headers.size(); ++index) {
        if (headers[index] == key_column) {
            key_column_index = index;
            break;
        }
    }
    
    if (key_column_index == -1) {
        throw std::runtime_error("Key column '" + key_column + "' not found in metadata");
    }
    
    // Determine which columns to keep
    std::vector<int> column_indices;
    if (requested_columns.empty()) {
        // Keep all columns
        for (int i = 0; i < headers.size(); ++i) {
            if (i != key_column_index) {
                column_indices.push_back(i);
                column_names.push_back(headers[i]);
            }
        }
    } else {
        // Keep only requested columns
        for (const auto& col : requested_columns) {
            auto it = std::find(headers.begin(), headers.end(), col);
            if (it != headers.end()) {
                int idx = std::distance(headers.begin(), it);
                if (idx != key_column_index) {
                    column_indices.push_back(idx);
                    column_names.push_back(col);
                }
            }
        }
    }
    
    // Read data
#ifdef USE_TBB
    // Bounded concurrent queue to limit memory usage
    tbb::concurrent_bounded_queue<std::string> line_queue;
    line_queue.set_capacity(1000); // Process in chunks of 1000 lines
    std::atomic<bool> done_reading{false};
    
    // Mutex for string pool and metadata map
    std::mutex pool_mutex;
    std::mutex metadata_mutex;
    
    // Producer thread
    std::thread producer([&]() {
        std::string line;
        while (std::getline(*input, line)) {
            line_queue.push(line); // Will block if queue is full
        }
        done_reading = true;
    });
    
    // Consumer threads
    const size_t num_consumers = std::thread::hardware_concurrency() - 1; // Leave one for producer
    std::vector<std::thread> consumers;
    
    for (size_t i = 0; i < num_consumers; ++i) {
        consumers.emplace_back([&]() {
            std::string line;
            while (!done_reading || !line_queue.empty()) {
                if (line_queue.try_pop(line)) {
                    auto fields = fast_split(line, '\t');
                    
                    if (fields.size() > key_column_index) {
                        std::string key = fields[key_column_index];
                        std::unordered_map<std::string, std::string> row_data;
                        
                        // Synchronize string pool access
                        {
                            std::lock_guard<std::mutex> lock(pool_mutex);
                            auto& pool = get_metadata_pool();
                            for (size_t i = 0; i < column_indices.size(); ++i) {
                                if (column_indices[i] < fields.size()) {
                                    const auto& col_key = pool.intern(column_names[i]);
                                    const auto& value = pool.intern(fields[column_indices[i]]);
                                    row_data[col_key] = value;
                                }
                            }
                        }
                        
                        // Synchronize metadata map access
                        {
                            std::lock_guard<std::mutex> lock(metadata_mutex);
                            metadata[key] = std::move(row_data);
                        }
                    }
                }
            }
        });
    }
    
    // Wait for all threads
    producer.join();
    for (auto& consumer : consumers) {
        consumer.join();
    }
#else
    // Sequential fallback
    std::string line;
    while (std::getline(*input, line)) {
        auto fields = fast_split(line, '\t');
        
        if (fields.size() > key_column_index) {
            std::string key = fields[key_column_index];
            std::unordered_map<std::string, std::string> row_data;
            
            auto& pool = get_metadata_pool();
            for (size_t i = 0; i < column_indices.size(); ++i) {
                if (column_indices[i] < fields.size()) {
                    // Intern both key and value to save memory
                    const auto& key = pool.intern(column_names[i]);
                    const auto& value = pool.intern(fields[column_indices[i]]);
                    row_data[key] = value;
                }
            }
            
            metadata[key] = std::move(row_data);
        }
    }
#endif
    
    std::cout << "Loaded metadata for " << metadata.size() << " samples" << std::endl;
    std::cout << "String pool size: " << get_metadata_pool().size() << " unique strings" << std::endl;
}

void MetadataReader::apply_to_tree(Tree* tree, std::function<void(size_t)> progress_callback) {
#ifdef USE_TBB
    // Parallel version using TBB
    
    // First, collect all nodes into a vector
    std::vector<Node*> all_nodes;
    tree->traverse_preorder([&](Node* node) {
        all_nodes.push_back(node);
    });
    
    std::atomic<size_t> matched{0};
    std::atomic<size_t> processed{0};
    
    // Process nodes in parallel
    tbb::parallel_for(tbb::blocked_range<size_t>(0, all_nodes.size()),
        [&](const tbb::blocked_range<size_t>& range) {
            for (size_t i = range.begin(); i != range.end(); ++i) {
                Node* node = all_nodes[i];
                if (!node->name.empty()) {
                    auto it = metadata.find(node->name);
                    if (it != metadata.end()) {
                        // Reference the already-interned strings from metadata storage
                        node->metadata = it->second;
                        matched.fetch_add(1);
                    }
                }
                
                // Update progress periodically (every 100 nodes to reduce contention)
                size_t current_processed = processed.fetch_add(1) + 1;
                if (progress_callback && (current_processed % 100 == 0 || current_processed == all_nodes.size())) {
                    progress_callback(current_processed);
                }
            }
        });
    
    std::cout << "Matched metadata for " << matched.load() << " nodes" << std::endl;
    
#else
    // Sequential fallback version
    size_t matched = 0;
    size_t processed = 0;
    
    tree->traverse_preorder([&](Node* node) {
        if (!node->name.empty()) {
            auto it = metadata.find(node->name);
            if (it != metadata.end()) {
                // Reference the already-interned strings from metadata storage
                node->metadata = it->second;
                matched++;
            }
        }
        processed++;
        if (progress_callback) {
            progress_callback(processed);
        }
    });
    
    std::cout << "Matched metadata for " << matched << " nodes" << std::endl;
#endif
}

} // namespace taxonium