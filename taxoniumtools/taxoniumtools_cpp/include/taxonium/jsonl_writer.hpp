#pragma once

#include "tree.hpp"
#include <string>
#include <fstream>
#include <memory>

namespace taxonium {

class JSONLWriter {
private:
    std::unique_ptr<std::ostream> output_stream;
    bool is_gzipped;
    // Content-based mutation indexing (like Python's input_to_index)
    std::unordered_map<std::string, size_t> mutation_content_to_index;
    
public:
    explicit JSONLWriter(const std::string& filename);
    ~JSONLWriter();
    
    // Write the entire tree in JSONL format
    void write_tree(Tree* tree);
    
private:
    // Write the header line with mutations and config
    void write_header(Tree* tree);
    
    // Write a single node as JSON
    void write_node(Node* node, size_t node_index, 
                    const std::unordered_map<Node*, size_t>& node_to_index);
    
    // Write node to a stream (for parallel processing)
    void write_node_to_stream(Node* node, size_t node_index,
                              const std::unordered_map<Node*, size_t>& node_to_index,
                              std::ostream& stream);
    
    // Convert mutation to JSON object
    std::string mutation_to_json(const Mutation& mut, size_t index);
    
    // Convert AA mutation to JSON object
    std::string aa_mutation_to_json(const AAMutation& aa_mut, size_t index);
    
    // Escape string for JSON
    std::string escape_json(const std::string& s);
    
    // Helper functions for content-based mutation keys
    std::string mutation_to_key(const Mutation& mut);
    std::string aa_mutation_to_key(const AAMutation& aa_mut);
};

} // namespace taxonium