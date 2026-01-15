#pragma once

#include "node.hpp"
#include "gene.hpp"
#include <memory>
#include <unordered_map>
#include <vector>
#include <functional>

namespace taxonium {

class Tree {
private:
    std::unique_ptr<Node> root;
    std::unordered_map<std::string, Node*> node_map;
    std::vector<Gene> genes;  // Gene details for config output

public:
    Tree() = default;
    ~Tree();  // Custom destructor for efficient cleanup

    // Get root node
    Node* get_root() { return root.get(); }
    const Node* get_root() const { return root.get(); }
    
    // Set root node
    void set_root(std::unique_ptr<Node> new_root);
    
    // Find node by name
    Node* find_node(const std::string& name);
    const Node* find_node(const std::string& name) const;
    
    // Tree operations
    void ladderize(bool ascending = false);
    void calculate_coordinates();
    void annotate_aa_mutations(const std::vector<Gene>& genes, const std::string& reference_sequence, std::function<void(size_t)> progress_callback = nullptr);
    void set_gene_details(const std::vector<Gene>& genes);
    
    // Traversal methods
    std::vector<Node*> get_nodes_breadth_first();
    std::vector<Node*> get_nodes_depth_first();
    std::vector<Node*> get_nodes_postorder();
    
    // Apply function to all nodes
    void traverse_preorder(std::function<void(Node*)> func);
    void traverse_postorder(std::function<void(Node*)> func);
    
    // Get all nodes sorted by y-coordinate
    std::vector<Node*> get_nodes_sorted_by_y();
    
    // Statistics
    size_t get_num_nodes() const { return node_map.size(); }
    size_t get_num_tips() const;

    // Gene details
    const std::vector<Gene>& get_genes() const { return genes; }

    // Rebuild node map (public for use after tree modifications)
    void build_node_map();
    
private:
    // Helper methods
    void ladderize_helper(Node* node, bool ascending);
    void set_dfs_indices(Node* node, size_t& current_index);
};

} // namespace taxonium