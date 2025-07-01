#include "taxonium/jsonl_writer.hpp"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <iomanip>
#include <chrono>
#include <ctime>
#include <map>
#include <tuple>

#ifdef USE_TBB
#include <tbb/parallel_for.h>
#include <tbb/concurrent_vector.h>
#include <tbb/parallel_sort.h>
#endif

#ifdef USE_BOOST
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#endif

namespace taxonium {

JSONLWriter::JSONLWriter(const std::string& filename) {
    is_gzipped = filename.find(".gz") != std::string::npos;
    
    if (is_gzipped) {
#ifdef USE_BOOST
        auto* file_stream = new std::ofstream(filename, std::ios::binary);
        auto* filtering_stream = new boost::iostreams::filtering_ostream();
        filtering_stream->push(boost::iostreams::gzip_compressor());
        filtering_stream->push(*file_stream);
        output_stream.reset(filtering_stream);
#else
        throw std::runtime_error("Gzip output requested but Boost not available");
#endif
    } else {
        output_stream = std::make_unique<std::ofstream>(filename);
    }
    
    if (!*output_stream) {
        throw std::runtime_error("Cannot open output file: " + filename);
    }
}

JSONLWriter::~JSONLWriter() {
    // Destructor will handle cleanup
}

void JSONLWriter::write_tree(Tree* tree) {
    // Calculate all necessary properties
    tree->calculate_coordinates();
    
    // Write header
    write_header(tree);
    
    // Get nodes sorted by y coordinate
    auto nodes = tree->get_nodes_sorted_by_y();
    
    // Create node to index map
    std::unordered_map<Node*, size_t> node_to_index;
    for (size_t i = 0; i < nodes.size(); ++i) {
        node_to_index[nodes[i]] = i;
    }
    
    // Write each node
    #ifdef USE_TBB
    // Process in chunks to reduce memory usage
    const size_t chunk_size = 10000;  // Process 10k nodes at a time
    for (size_t start = 0; start < nodes.size(); start += chunk_size) {
        size_t end = std::min(start + chunk_size, nodes.size());
        std::vector<std::string> node_strings(end - start);
        
        tbb::parallel_for(tbb::blocked_range<size_t>(start, end),
            [&](const tbb::blocked_range<size_t>& range) {
                for (size_t i = range.begin(); i != range.end(); ++i) {
                    std::stringstream local_ss;
                    write_node_to_stream(nodes[i], i, node_to_index, local_ss);
                    node_strings[i - start] = local_ss.str();
                }
            });
        
        // Write this chunk
        for (const auto& node_str : node_strings) {
            *output_stream << node_str;
        }
    }
    #else
    // Serial version
    for (size_t i = 0; i < nodes.size(); ++i) {
        write_node(nodes[i], i, node_to_index);
    }
    #endif
    
    output_stream->flush();
}

void JSONLWriter::write_header(Tree* tree) {
    std::stringstream ss;
    ss << "{";
    
    // Version
    ss << "\"version\":\"2.1.2\",";
    
    // Collect all unique nucleotide mutations from all nodes
    std::map<std::tuple<std::string, int32_t, Nucleotide, Nucleotide>, size_t> unique_mutations;
    std::vector<Mutation> all_mutations_vec;
    
    // Collect all unique amino acid mutations from all nodes
    std::map<std::tuple<std::string, int32_t, std::string, std::string>, size_t> unique_aa_mutations;
    std::vector<AAMutation> all_aa_mutations_vec;
    
    tree->traverse_preorder([&](Node* node) {
        // Process nucleotide mutations
        for (auto& mut : node->mutations) {
            auto key = std::make_tuple(mut.chromosome, mut.position, mut.par_nuc, mut.mut_nuc);
            if (unique_mutations.find(key) == unique_mutations.end()) {
                size_t index = all_mutations_vec.size();
                unique_mutations[key] = index;
                all_mutations_vec.push_back(mut);
            }
            mutation_to_index[&mut] = unique_mutations[key];
        }
        
        // Process amino acid mutations
        for (auto& aa_mut : node->aa_mutations) {
            auto key = std::make_tuple(aa_mut.gene, aa_mut.codon_position, aa_mut.ref_aa, aa_mut.alt_aa);
            if (unique_aa_mutations.find(key) == unique_aa_mutations.end()) {
                size_t index = all_mutations_vec.size() + all_aa_mutations_vec.size();
                unique_aa_mutations[key] = index;
                all_aa_mutations_vec.push_back(aa_mut);
            }
            aa_mutation_to_index[&aa_mut] = unique_aa_mutations[key];
        }
    });
    
    // Write mutations array (both nucleotide and amino acid)
    ss << "\"mutations\":[";
    size_t total_mutations = all_mutations_vec.size() + all_aa_mutations_vec.size();
    size_t mut_index = 0;
    
    // Write nucleotide mutations
    for (size_t i = 0; i < all_mutations_vec.size(); ++i) {
        if (mut_index > 0) ss << ",";
        ss << mutation_to_json(all_mutations_vec[i], mut_index);
        mut_index++;
    }
    
    // Write amino acid mutations
    for (size_t i = 0; i < all_aa_mutations_vec.size(); ++i) {
        if (mut_index > 0) ss << ",";
        ss << aa_mutation_to_json(all_aa_mutations_vec[i], mut_index);
        mut_index++;
    }
    
    ss << "],";
    
    // Total nodes - count from sorted list
    auto all_nodes = tree->get_nodes_sorted_by_y();
    ss << "\"total_nodes\":" << all_nodes.size() << ",";
    
    // Config
    ss << "\"config\":{";
    ss << "\"num_tips\":" << tree->get_num_tips() << ",";
    
    // Date created
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::localtime(&time_t);
    ss << "\"date_created\":\"" << std::put_time(&tm, "%Y-%m-%d") << "\"";
    
    ss << "}";  // End config
    ss << "}\n";  // End header
    
    *output_stream << ss.str();
}

void JSONLWriter::write_node(Node* node, size_t node_index,
                             const std::unordered_map<Node*, size_t>& node_to_index) {
    write_node_to_stream(node, node_index, node_to_index, *output_stream);
}

void JSONLWriter::write_node_to_stream(Node* node, size_t node_index,
                                       const std::unordered_map<Node*, size_t>& node_to_index,
                                       std::ostream& stream) {
    std::stringstream ss;
    ss << "{";
    
    // Name (always include)
    ss << "\"name\":\"" << escape_json(node->name) << "\",";
    
    // Coordinates
    ss << std::fixed << std::setprecision(5);  // Match Python precision
    ss << "\"x_dist\":" << node->x_coord << ",";
    
    // Y coordinate - output as integer for leaves to match Python
    if (node->is_leaf()) {
        ss << "\"y\":" << static_cast<int>(node->y_coord) << ",";
    } else {
        ss << "\"y\":" << node->y_coord << ",";
    }
    
    // Mutations (as indices) - always include even if empty
    ss << "\"mutations\":[";
    bool first = true;
    
    // Add nucleotide mutations
    for (const auto& mut : node->mutations) {
        auto it = mutation_to_index.find(const_cast<Mutation*>(&mut));
        if (it != mutation_to_index.end()) {
            if (!first) ss << ",";
            ss << it->second;
            first = false;
        }
    }
    
    // Add amino acid mutations
    for (const auto& aa_mut : node->aa_mutations) {
        auto it = aa_mutation_to_index.find(const_cast<AAMutation*>(&aa_mut));
        if (it != aa_mutation_to_index.end()) {
            if (!first) ss << ",";
            ss << it->second;
            first = false;
        }
    }
    
    ss << "],";
    
    // Is tip
    ss << "\"is_tip\":" << (node->is_leaf() ? "true" : "false") << ",";
    
    // Parent - for root node, parent_id equals its own node_id
    if (node->parent) {
        auto it = node_to_index.find(node->parent);
        if (it != node_to_index.end()) {
            ss << "\"parent_id\":" << it->second << ",";
        }
    } else {
        // Root node: parent_id equals its own node_id
        ss << "\"parent_id\":" << node_index << ",";
    }
    
    // Node ID
    ss << "\"node_id\":" << node_index << ",";
    
    // Number of tips
    ss << "\"num_tips\":" << node->num_tips << ",";
    
    // Children (only for internal nodes that have children)
    if (!node->is_leaf()) {
        ss << "\"child_nodes\":[";
        bool first = true;
        for (const auto& child : node->children) {
            auto it = node_to_index.find(child.get());
            if (it != node_to_index.end()) {
                if (!first) ss << ",";
                ss << it->second;
                first = false;
            }
        }
        ss << "],";
    }
    
    // Metadata
    for (const auto& [key, value] : node->metadata) {
        ss << "\"meta_" << escape_json(key) << "\":\"" << escape_json(value) << "\",";
    }
    
    // Remove trailing comma
    std::string result = ss.str();
    if (result.back() == ',') {
        result.pop_back();
    }
    
    result += "}\n";
    stream << result;
}

std::string JSONLWriter::mutation_to_json(const Mutation& mut, size_t index) {
    std::stringstream ss;
    ss << "{";
    
    ss << "\"gene\":\"nt\",";  // nucleotide mutation type
    ss << "\"previous_residue\":\"" << nuc_to_char(mut.par_nuc) << "\",";
    ss << "\"residue_pos\":" << mut.position << ",";
    ss << "\"new_residue\":\"" << nuc_to_char(mut.mut_nuc) << "\",";
    ss << "\"mutation_id\":" << index << ",";
    ss << "\"type\":\"nt\"";
    
    ss << "}";
    return ss.str();
}

std::string JSONLWriter::aa_mutation_to_json(const AAMutation& aa_mut, size_t index) {
    std::stringstream ss;
    ss << "{";
    
    ss << "\"gene\":\"" << escape_json(aa_mut.gene) << "\",";
    ss << "\"previous_residue\":\"" << escape_json(aa_mut.ref_aa) << "\",";
    ss << "\"residue_pos\":" << aa_mut.codon_position << ",";
    ss << "\"new_residue\":\"" << escape_json(aa_mut.alt_aa) << "\",";
    ss << "\"mutation_id\":" << index << ",";
    ss << "\"nuc_for_codon\":" << aa_mut.nuc_for_codon << ",";
    ss << "\"type\":\"aa\"";
    
    ss << "}";
    return ss.str();
}

std::string JSONLWriter::escape_json(const std::string& s) {
    std::stringstream ss;
    for (char c : s) {
        switch (c) {
            case '"': ss << "\\\""; break;
            case '\\': ss << "\\\\"; break;
            case '\b': ss << "\\b"; break;
            case '\f': ss << "\\f"; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            default:
                if (c >= 0x20) {
                    ss << c;
                } else {
                    ss << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                }
        }
    }
    return ss.str();
}

} // namespace taxonium