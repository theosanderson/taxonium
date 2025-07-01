#include "taxonium/metadata_reader.hpp"
#include "taxonium/string_pool.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <atomic>

#ifdef USE_TBB
#include <tbb/parallel_for.h>
#include <tbb/blocked_range.h>
#endif

#ifdef USE_BOOST
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#endif

namespace taxonium {

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
    
    // Parse header
    std::vector<std::string> headers;
    std::stringstream header_ss(header_line);
    std::string header;
    int key_column_index = -1;
    int index = 0;
    
    while (std::getline(header_ss, header, '\t')) {
        headers.push_back(header);
        if (header == key_column) {
            key_column_index = index;
        }
        index++;
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
    std::string line;
    while (std::getline(*input, line)) {
        std::vector<std::string> fields;
        std::stringstream line_ss(line);
        std::string field;
        
        while (std::getline(line_ss, field, '\t')) {
            fields.push_back(field);
        }
        
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