#include "taxonium/tree.hpp"
#include "taxonium/codon_table.hpp"
#include "taxonium/genbank_parser.hpp"
#include <queue>
#include <stack>
#include <algorithm>
#include <limits>
#include <cmath>
#include <unordered_map>

#ifdef USE_TBB
#include <tbb/parallel_for.h>
#include <tbb/blocked_range.h>
#endif

namespace taxonium {

void Tree::set_root(std::unique_ptr<Node> new_root) {
    root = std::move(new_root);
    build_node_map();
}

Node* Tree::find_node(const std::string& name) {
    auto it = node_map.find(name);
    return (it != node_map.end()) ? it->second : nullptr;
}

const Node* Tree::find_node(const std::string& name) const {
    auto it = node_map.find(name);
    return (it != node_map.end()) ? it->second : nullptr;
}

void Tree::build_node_map() {
    node_map.clear();
    if (!root) return;
    
    std::queue<Node*> queue;
    queue.push(root.get());
    
    while (!queue.empty()) {
        Node* current = queue.front();
        queue.pop();
        
        if (!current->name.empty()) {
            node_map[current->name] = current;
        }
        
        for (auto& child : current->children) {
            queue.push(child.get());
        }
    }
}

void Tree::ladderize(bool ascending) {
    if (!root) return;
    ladderize_helper(root.get(), ascending);
}

void Tree::ladderize_helper(Node* node, bool ascending) {
    if (node->is_leaf()) return;
    
    // First, recursively ladderize all children
    for (auto& child : node->children) {
        ladderize_helper(child.get(), ascending);
    }
    
    // Sort children by number of tips
    std::sort(node->children.begin(), node->children.end(),
        [ascending](const std::unique_ptr<Node>& a, const std::unique_ptr<Node>& b) {
            if (ascending) {
                return a->num_tips < b->num_tips;
            } else {
                return a->num_tips > b->num_tips;
            }
        });
}

void Tree::calculate_coordinates() {
    if (!root) return;
    
    // First, calculate number of tips for each node
    root->calculate_num_tips();
    
    // Set edge lengths based on mutation count
    traverse_preorder([](Node* node) {
        node->edge_length = static_cast<double>(node->mutations.size());
    });
    
    // Set DFS indices
    size_t index = 0;
    set_dfs_indices(root.get(), index);
    
    // Calculate x coordinates based on cumulative edge lengths
    std::function<void(Node*, double)> set_x_dist = [&](Node* node, double parent_x) {
        if (node->parent) {
            node->x_coord = parent_x + node->edge_length;
        } else {
            node->x_coord = 0.0;  // Root starts at 0
        }
        for (auto& child : node->children) {
            set_x_dist(child.get(), node->x_coord);
        }
    };
    set_x_dist(root.get(), 0.0);
    
    // Normalize x coordinates - find 95th percentile and scale to 600
    std::vector<double> all_x_coords;
    traverse_preorder([&](Node* node) {
        all_x_coords.push_back(node->x_coord);
    });
    
    std::sort(all_x_coords.begin(), all_x_coords.end());
    double percentile_95 = all_x_coords[static_cast<size_t>(all_x_coords.size() * 0.95)];
    
    if (percentile_95 > 0) {
        traverse_preorder([&](Node* node) {
            node->x_coord = 600.0 * (node->x_coord / percentile_95);
        });
    }
    
    // Calculate y coordinates
    // First set terminal (leaf) y coordinates based on traversal order
    size_t leaf_count = 0;
    std::function<void(Node*)> set_leaf_y = [&](Node* node) {
        if (node->is_leaf()) {
            node->y_coord = static_cast<double>(leaf_count++);
        } else {
            for (auto& child : node->children) {
                set_leaf_y(child.get());
            }
        }
    };
    set_leaf_y(root.get());
    
    // Then set internal y coordinates as average of children (postorder)
    std::function<void(Node*)> set_internal_y = [&](Node* node) {
        if (!node->is_leaf()) {
            for (auto& child : node->children) {
                set_internal_y(child.get());
            }
            double sum = 0.0;
            double min_y = std::numeric_limits<double>::max();
            double max_y = std::numeric_limits<double>::min();
            for (auto& child : node->children) {
                min_y = std::min(min_y, child->y_coord);
                max_y = std::max(max_y, child->y_coord);
            }
            node->y_coord = (min_y + max_y) / 2.0;
        }
    };
    set_internal_y(root.get());
}

void Tree::set_dfs_indices(Node* node, size_t& current_index) {
    node->dfs_index = current_index++;
    
    for (auto& child : node->children) {
        set_dfs_indices(child.get(), current_index);
    }
    
    node->dfs_end_index = current_index - 1;
}

std::vector<Node*> Tree::get_nodes_breadth_first() {
    std::vector<Node*> nodes;
    if (!root) return nodes;
    
    std::queue<Node*> queue;
    queue.push(root.get());
    
    while (!queue.empty()) {
        Node* current = queue.front();
        queue.pop();
        nodes.push_back(current);
        
        for (auto& child : current->children) {
            queue.push(child.get());
        }
    }
    
    return nodes;
}

std::vector<Node*> Tree::get_nodes_depth_first() {
    std::vector<Node*> nodes;
    if (!root) return nodes;
    
    std::stack<Node*> stack;
    stack.push(root.get());
    
    while (!stack.empty()) {
        Node* current = stack.top();
        stack.pop();
        nodes.push_back(current);
        
        // Add children in reverse order to maintain left-to-right traversal
        for (auto it = current->children.rbegin(); it != current->children.rend(); ++it) {
            stack.push(it->get());
        }
    }
    
    return nodes;
}

std::vector<Node*> Tree::get_nodes_postorder() {
    std::vector<Node*> nodes;
    if (!root) return nodes;
    
    std::function<void(Node*)> traverse = [&](Node* node) {
        for (auto& child : node->children) {
            traverse(child.get());
        }
        nodes.push_back(node);
    };
    
    traverse(root.get());
    return nodes;
}

void Tree::traverse_preorder(std::function<void(Node*)> func) {
    if (!root) return;
    
    std::function<void(Node*)> traverse = [&](Node* node) {
        func(node);
        for (auto& child : node->children) {
            traverse(child.get());
        }
    };
    
    traverse(root.get());
}

void Tree::traverse_postorder(std::function<void(Node*)> func) {
    if (!root) return;
    
    std::function<void(Node*)> traverse = [&](Node* node) {
        for (auto& child : node->children) {
            traverse(child.get());
        }
        func(node);
    };
    
    traverse(root.get());
}

std::vector<Node*> Tree::get_nodes_sorted_by_y() {
    // Collect all nodes in preorder (matching Python's traverse_preorder)
    std::vector<Node*> nodes;
    
    std::function<void(Node*)> collect_preorder = [&](Node* node) {
        nodes.push_back(node);
        for (auto& child : node->children) {
            collect_preorder(child.get());
        }
    };
    
    if (root) {
        collect_preorder(root.get());
    }
    
    // Sort by y-coordinate using stable_sort to preserve preorder when y values are equal
    std::stable_sort(nodes.begin(), nodes.end(),
        [](const Node* a, const Node* b) {
            return a->y_coord < b->y_coord;
        });
    
    return nodes;
}

size_t Tree::get_num_tips() const {
    return root ? root->num_tips : 0;
}

void Tree::annotate_aa_mutations(const std::vector<Gene>& genes, const std::string& reference_sequence) {
    if (!root || genes.empty() || reference_sequence.empty()) return;
    
    // Helper function to get sequence at a node by applying mutations
    auto get_sequence_at_node = [&](Node* node, const std::string& parent_seq) -> std::string {
        std::string seq = parent_seq;
        for (const auto& mut : node->mutations) {
            if (mut.position > 0 && mut.position <= static_cast<int32_t>(seq.length())) {
                seq[mut.position - 1] = nuc_to_char(mut.mut_nuc);  // Convert to 0-indexed
            }
        }
        return seq;
    };
    
    // Recursive function to annotate AA mutations
    std::function<void(Node*, const std::string&)> annotate_node = [&](Node* node, const std::string& parent_seq) {
        // Get this node's sequence
        std::string node_seq = get_sequence_at_node(node, parent_seq);
        
        // Clear existing AA mutations
        node->aa_mutations.clear();
        
        // For each gene, check for AA changes
        for (const auto& gene : genes) {
            if (gene.strand == '-') continue;  // Skip reverse strand genes for now
            
            // Extract gene sequences
            if (gene.end <= static_cast<int32_t>(parent_seq.length()) && 
                gene.end <= static_cast<int32_t>(node_seq.length())) {
                
                std::string parent_gene_seq = parent_seq.substr(gene.start, gene.length());
                std::string node_gene_seq = node_seq.substr(gene.start, gene.length());
                
                // Translate to amino acids
                std::string parent_aa = CodonTable::translate_sequence(parent_gene_seq);
                std::string node_aa = CodonTable::translate_sequence(node_gene_seq);
                
                // Find AA differences
                for (size_t i = 0; i < std::min(parent_aa.length(), node_aa.length()); ++i) {
                    if (parent_aa[i] != node_aa[i]) {
                        AAMutation aa_mut;
                        aa_mut.gene = gene.name;
                        aa_mut.codon_position = static_cast<int32_t>(i + 1);  // 1-indexed
                        aa_mut.ref_aa = std::string(1, parent_aa[i]);
                        aa_mut.alt_aa = std::string(1, node_aa[i]);
                        node->aa_mutations.push_back(aa_mut);
                    }
                }
            }
        }
        
        // Recursively process children
        for (auto& child : node->children) {
            annotate_node(child.get(), node_seq);
        }
    };
    
    // Start annotation from root
    annotate_node(root.get(), reference_sequence);
}

} // namespace taxonium