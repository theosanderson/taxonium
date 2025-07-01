#pragma once

#include "mutation.hpp"
#include <string>
#include <vector>
#include <memory>
#include <unordered_map>

namespace taxonium {

class Node {
public:
    // Node identifier
    std::string name;
    
    // Tree structure
    Node* parent;
    std::vector<std::unique_ptr<Node>> children;
    
    // Mutations on this branch
    std::vector<Mutation> mutations;
    std::vector<AAMutation> aa_mutations;
    
    // Metadata
    std::unordered_map<std::string, std::string> metadata;
    std::vector<std::string> clade_annotations;
    
    // Computed properties
    double x_coord;  // Time or divergence
    double y_coord;  // For visualization
    double edge_length;  // Branch length (typically number of mutations)
    size_t num_tips;  // Number of descendant tips
    size_t dfs_index;  // Depth-first search index
    size_t dfs_end_index;  // End of subtree in DFS
    
    // Constructor
    Node(const std::string& name = "") 
        : name(name), parent(nullptr), x_coord(0), y_coord(0), 
          edge_length(0), num_tips(0), dfs_index(0), dfs_end_index(0) {}
    
    // Tree operations
    bool is_leaf() const { return children.empty(); }
    bool is_root() const { return parent == nullptr; }
    
    // Add a child node
    Node* add_child(const std::string& child_name);
    
    // Calculate number of tips in subtree
    size_t calculate_num_tips();
    
    // Get all descendants (including self)
    std::vector<Node*> get_descendants();
    
    // Get all leaves in subtree
    std::vector<Node*> get_leaves();
    
    // Metadata access helpers using string table
    void set_metadata(const std::string& key, const std::string& value);
    std::string get_metadata(const std::string& key) const;
    bool has_metadata(const std::string& key) const;
    
    // Get all metadata as strings (for serialization)
    std::unordered_map<std::string, std::string> get_metadata_map() const;
};

} // namespace taxonium