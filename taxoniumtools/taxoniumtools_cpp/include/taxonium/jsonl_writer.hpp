#pragma once

#include "tree.hpp"
#include <string>
#include <fstream>
#include <memory>
#include <functional>
#include <yyjson.h>

namespace taxonium {

class JSONLWriter {
private:
    std::unique_ptr<std::ostream> output_stream;
    bool is_gzipped;
    // Content-based mutation indexing (like Python's input_to_index)
    std::unordered_map<std::string, size_t> mutation_content_to_index;
    // Metadata column names (for ensuring all columns are present in output)
    std::vector<std::string> metadata_columns;

public:
    explicit JSONLWriter(const std::string& filename);
    ~JSONLWriter();

    // Close the output stream (important for gzip to write trailer)
    void close();

    // Set metadata column names
    void set_metadata_columns(const std::vector<std::string>& columns) {
        metadata_columns = columns;
    }

    // Write the entire tree in JSONL format
    void write_tree(Tree* tree, std::function<void(size_t)> progress_callback = nullptr);
    
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
    
    // Convert mutation to JSON object (legacy string-based)
    std::string mutation_to_json(const Mutation& mut, size_t index);
    
    // Convert AA mutation to JSON object (legacy string-based)
    std::string aa_mutation_to_json(const AAMutation& aa_mut, size_t index);
    
    // Convert mutation to yyjson object
    yyjson_mut_val* mutation_to_yyjson(const Mutation& mut, size_t index, yyjson_mut_doc* doc);
    
    // Convert AA mutation to yyjson object
    yyjson_mut_val* aa_mutation_to_yyjson(const AAMutation& aa_mut, size_t index, yyjson_mut_doc* doc);
    
    // Escape string for JSON
    std::string escape_json(const std::string& s);
    
    // Helper functions for content-based mutation keys
    std::string mutation_to_key(const Mutation& mut);
    std::string aa_mutation_to_key(const AAMutation& aa_mut);
};

} // namespace taxonium