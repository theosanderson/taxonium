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
    
    // Sort children exactly like Python but keep the REVERSED direction that was working
    std::sort(node->children.begin(), node->children.end(),
        [ascending](const std::unique_ptr<Node>& a, const std::unique_ptr<Node>& b) {
            // 1. Primary: number of descendants (tips) - REVERSED
            if (a->num_tips != b->num_tips) {
                if (ascending) {
                    return a->num_tips > b->num_tips;  // Reversed
                } else {
                    return a->num_tips < b->num_tips;  // Reversed
                }
            }
            
            // 2. Secondary: edge_length is not None (both always have it in C++)
            // Skip this check since both always have edge_length
            
            // 3. Tertiary: edge length value - REVERSED  
            if (a->edge_length != b->edge_length) {
                if (ascending) {
                    return a->edge_length > b->edge_length;  // Reversed
                } else {
                    return a->edge_length < b->edge_length;  // Reversed
                }
            }
            
            // 4. Quaternary: label is not None (name empty vs non-empty)
            bool a_has_name = !a->name.empty();
            bool b_has_name = !b->name.empty();
            if (a_has_name != b_has_name) {
                if (ascending) {
                    return !a_has_name > !b_has_name;  // Reversed
                } else {
                    return !a_has_name < !b_has_name;  // Reversed
                }
            }
            
            // 5. Quinary: label (name) value - REVERSED
            if (ascending) {
                return a->name > b->name;  // Reversed
            } else {
                return a->name < b->name;  // Reversed
            }
        });
}

void Tree::calculate_coordinates() {
    if (!root) return;
    
    // num_tips should already be calculated before ladderizing
    // root->calculate_num_tips(); // Moved to main.cpp
    
    // edge_length should already be calculated before ladderizing
    // (moved to main.cpp)
    
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

void Tree::annotate_aa_mutations(const std::vector<Gene>& genes, const std::string& reference_sequence, std::function<void(size_t)> progress_callback) {
    if (!root || genes.empty() || reference_sequence.empty()) return;
    
    // Create a nucleotide-to-codon mapping like Python's nuc_to_codon
    std::unordered_map<int32_t, std::vector<std::pair<int32_t, int32_t>>> nuc_to_codon; // position -> [(gene_idx, codon_pos), ...]
    
    for (size_t gene_idx = 0; gene_idx < genes.size(); ++gene_idx) {
        const auto& gene = genes[gene_idx];
        
        int32_t nucleotide_counter = 0;
        for (int32_t genome_pos = gene.start; genome_pos < gene.end; ++genome_pos) {
            int32_t codon_number = nucleotide_counter / 3;
            int32_t pos_in_codon = nucleotide_counter % 3;
            
            // Map this genomic position to this gene's codon
            nuc_to_codon[genome_pos].push_back({static_cast<int32_t>(gene_idx), codon_number});
            nucleotide_counter++;
        }
    }
    
    // Progress tracking
    size_t processed_nodes = 0;
    
    // Recursive function to annotate AA mutations (following Python's recursive_mutation_analysis)
    std::function<void(Node*, std::unordered_map<int32_t, char>&)> annotate_node = 
        [&](Node* node, std::unordered_map<int32_t, char>& past_nuc_muts_dict) {
        
        // Clear existing AA mutations
        node->aa_mutations.clear();
        
        // Group mutations by codon (like Python's by_codon)
        std::unordered_map<std::string, std::vector<Mutation>> by_codon; // "gene_idx:codon_num" -> mutations
        
        for (const auto& mutation : node->mutations) {
            int32_t zero_indexed_pos = mutation.position - 1;
            if (nuc_to_codon.find(zero_indexed_pos) != nuc_to_codon.end()) {
                for (const auto& codon_info : nuc_to_codon[zero_indexed_pos]) {
                    std::string key = std::to_string(codon_info.first) + ":" + std::to_string(codon_info.second);
                    by_codon[key].push_back(mutation);
                }
            }
        }
        
        // Process each affected codon
        for (const auto& [key, mutations] : by_codon) {
            // Parse gene_idx:codon_num
            size_t colon_pos = key.find(':');
            int32_t gene_idx = std::stoi(key.substr(0, colon_pos));
            int32_t codon_number = std::stoi(key.substr(colon_pos + 1));
            
            const auto& gene = genes[gene_idx];
            
            // Calculate codon positions
            int32_t codon_start = gene.start + codon_number * 3;
            
            // Build initial codon from reference sequence
            std::string initial_codon = "";
            std::string final_codon = "";
            
            for (int32_t i = 0; i < 3; ++i) {
                int32_t pos = codon_start + i;
                if (pos < static_cast<int32_t>(reference_sequence.length())) {
                    char nucleotide = reference_sequence[pos];
                    
                    // Apply past mutations
                    if (past_nuc_muts_dict.find(pos) != past_nuc_muts_dict.end()) {
                        nucleotide = past_nuc_muts_dict[pos];
                    }
                    
                    initial_codon += nucleotide;
                    final_codon += nucleotide;
                }
            }
            
            // Apply current mutations to final codon
            for (const auto& mutation : mutations) {
                int32_t pos_in_codon = (mutation.position - 1) - codon_start;
                if (pos_in_codon >= 0 && pos_in_codon < 3) {
                    final_codon[pos_in_codon] = nuc_to_char(mutation.mut_nuc);
                }
            }
            
            // Handle reverse strand genes
            if (gene.strand == '-') {
                // Reverse complement both codons
                auto complement_seq = [](const std::string& seq) {
                    std::string comp;
                    for (char c : seq) {
                        switch(c) {
                            case 'A': comp += 'T'; break;
                            case 'T': comp += 'A'; break;
                            case 'C': comp += 'G'; break;
                            case 'G': comp += 'C'; break;
                            default: comp += c; break;
                        }
                    }
                    return comp;
                };
                initial_codon = complement_seq(initial_codon);
                final_codon = complement_seq(final_codon);
            }
            
            // Translate to amino acids
            char initial_aa = CodonTable::translate(initial_codon);
            char final_aa = CodonTable::translate(final_codon);
            
            // Add AA mutation if there's a difference
            if (initial_aa != final_aa) {
                AAMutation aa_mut;
                aa_mut.gene = gene.name;
                aa_mut.codon_position = codon_number + 1;  // 1-indexed
                aa_mut.ref_aa = std::string(1, initial_aa);
                aa_mut.alt_aa = std::string(1, final_aa);
                // Set nuc_for_codon to the middle nucleotide position of the codon (1-indexed)
                aa_mut.nuc_for_codon = codon_start + 1 + 1;  // +1 for middle position, +1 for 1-indexed
                node->aa_mutations.push_back(aa_mut);
            }
        }
        
        // Update past mutations dict with current mutations
        std::unordered_map<int32_t, char> new_past_nuc_muts_dict = past_nuc_muts_dict;
        for (const auto& mutation : node->mutations) {
            new_past_nuc_muts_dict[mutation.position - 1] = nuc_to_char(mutation.mut_nuc);
        }
        
        // Report progress
        processed_nodes++;
        if (progress_callback) {
            progress_callback(processed_nodes);
        }
        
        // Recursively process children
        for (auto& child : node->children) {
            annotate_node(child.get(), new_past_nuc_muts_dict);
        }
    };
    
    // Start annotation from root with empty past mutations
    std::unordered_map<int32_t, char> empty_past_muts;
    annotate_node(root.get(), empty_past_muts);
}

void Tree::set_gene_details(const std::vector<Gene>& genes) {
    // This method sets gene details for the configuration output
    // In the Python implementation, this adds gene information to the tree's metadata
    // For now, we'll store the genes in the tree for later use by the JSON writer
    
    // TODO: Store genes somewhere accessible by JSONLWriter
    // This might require adding a member variable to Tree or passing genes to the writer
}

} // namespace taxonium