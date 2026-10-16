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
#include <tbb/concurrent_vector.h>
#endif

namespace taxonium {

Tree::~Tree() {
    // Iterative destruction to avoid deep recursion and improve cache locality
    // With millions of nodes, recursive destruction is very slow
    if (!root) return;

    // Collect all nodes into a flat vector
    std::vector<std::unique_ptr<Node>> all_nodes;
    all_nodes.reserve(node_map.size() > 0 ? node_map.size() : 1000000);

    // Use a stack for iterative traversal
    std::vector<Node*> stack;
    stack.push_back(root.get());

    while (!stack.empty()) {
        Node* node = stack.back();
        stack.pop_back();

        // Add children to stack and transfer ownership to all_nodes
        for (auto& child : node->children) {
            stack.push_back(child.get());
            all_nodes.push_back(std::move(child));
        }
        node->children.clear();
    }

    // Now root and all_nodes will be destroyed when they go out of scope
    // but without deep recursion since children vectors are empty
    root.reset();
    // all_nodes destroyed here - flat iteration, no recursion
}

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

    // Sort children to match Python's tuple-based sort_key exactly
    // Use stable_sort to preserve order when elements are equal (matching Python's behavior)
    std::stable_sort(node->children.begin(), node->children.end(),
        [ascending](const std::unique_ptr<Node>& a, const std::unique_ptr<Node>& b) {
            // Match Python's sort_key function:
            // if ascending:
            //     return (-num_tips, -edge_len, -has_name, name[::-1])
            // else:
            //     return (num_tips, edge_len, has_name, name)

            if (ascending) {
                // Ascending mode: (-num_tips, -edge_len, -has_name, name[::-1])

                // 1. Compare -num_tips (so larger num_tips comes first)
                if (a->num_tips != b->num_tips) {
                    return a->num_tips > b->num_tips;
                }

                // 2. Compare -edge_length (so larger edge_length comes first)
                if (a->edge_length != b->edge_length) {
                    return a->edge_length > b->edge_length;
                }

                // 3. Compare -has_name (so nodes WITH names (1) come before nodes WITHOUT names (0))
                // In Python: has_name = 1 if label else 0
                // -has_name means: -1 if label else 0
                // So -1 < 0, meaning nodes with names come first
                bool a_has_name = !a->name.empty();
                bool b_has_name = !b->name.empty();
                if (a_has_name != b_has_name) {
                    return a_has_name > b_has_name;  // true > false, so names come first
                }

                // 4. Compare name[::-1] (reversed string comparison)
                // We need to compare strings in reverse order
                std::string a_rev(a->name.rbegin(), a->name.rend());
                std::string b_rev(b->name.rbegin(), b->name.rend());
                return a_rev < b_rev;  // Standard string comparison on reversed strings

            } else {
                // Standard order: (num_tips, edge_len, has_name, name)

                // 1. Compare num_tips (smaller comes first)
                if (a->num_tips != b->num_tips) {
                    return a->num_tips < b->num_tips;
                }

                // 2. Compare edge_length (smaller comes first)
                if (a->edge_length != b->edge_length) {
                    return a->edge_length < b->edge_length;
                }

                // 3. Compare has_name
                // In Python: has_name = 1 if label else 0
                // So 0 < 1, meaning nodes without names come first
                bool a_has_name = !a->name.empty();
                bool b_has_name = !b->name.empty();
                if (a_has_name != b_has_name) {
                    return a_has_name < b_has_name;  // false < true, so non-names come first
                }

                // 4. Compare name (standard string comparison)
                return a->name < b->name;
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
    
    // Sort by y-coordinate with tiebreakers for determinism
    // Primary: y coordinate
    // Secondary: x coordinate (for determinism when y is equal)
    // Tertiary: node name (for determinism when both y and x are equal)
    std::sort(nodes.begin(), nodes.end(),
        [](const Node* a, const Node* b) {
            if (a->y_coord != b->y_coord) {
                return a->y_coord < b->y_coord;
            }
            if (a->x_coord != b->x_coord) {
                return a->x_coord < b->x_coord;
            }
            return a->name < b->name;
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
    
    // Pre-calculate total positions for reserve
    size_t total_positions = 0;
    for (const auto& gene : genes) {
        total_positions += gene.length();
    }
    nuc_to_codon.reserve(total_positions);
    
    for (size_t gene_idx = 0; gene_idx < genes.size(); ++gene_idx) {
        const auto& gene = genes[gene_idx];
        
        int32_t nucleotide_counter = 0;
        
        // Handle multi-part genes
        if (!gene.parts.empty()) {
            // Process parts in order for forward strand, reverse for reverse strand
            if (gene.strand == '+') {
                for (const auto& part : gene.parts) {
                    for (int32_t genome_pos = part.start; genome_pos < part.end; ++genome_pos) {
                        int32_t codon_number = nucleotide_counter / 3;
                        int32_t pos_in_codon = nucleotide_counter % 3;
                        
                        // Map this genomic position to this gene's codon
                        nuc_to_codon[genome_pos].push_back({static_cast<int32_t>(gene_idx), codon_number});
                        nucleotide_counter++;
                    }
                }
            } else {
                // For reverse strand genes, process parts in reverse order
                for (auto it = gene.parts.rbegin(); it != gene.parts.rend(); ++it) {
                    for (int32_t genome_pos = it->start; genome_pos < it->end; ++genome_pos) {
                        int32_t codon_number = nucleotide_counter / 3;
                        int32_t pos_in_codon = nucleotide_counter % 3;
                        
                        // Map this genomic position to this gene's codon
                        nuc_to_codon[genome_pos].push_back({static_cast<int32_t>(gene_idx), codon_number});
                        nucleotide_counter++;
                    }
                }
            }
        } else {
            // Fallback for genes without parts (backward compatibility)
            for (int32_t genome_pos = gene.start; genome_pos < gene.end; ++genome_pos) {
                int32_t codon_number = nucleotide_counter / 3;
                int32_t pos_in_codon = nucleotide_counter % 3;
                
                // Map this genomic position to this gene's codon
                nuc_to_codon[genome_pos].push_back({static_cast<int32_t>(gene_idx), codon_number});
                nucleotide_counter++;
            }
        }
    }
    
    
    // Progress tracking
    std::atomic<size_t> processed_nodes{0};
    
    // Recursive function to annotate AA mutations (following Python's recursive_mutation_analysis)
    std::function<void(Node*, std::unordered_map<int32_t, char>&)> annotate_node = 
        [&](Node* node, std::unordered_map<int32_t, char>& past_nuc_muts_dict) {
        
        // Clear existing AA mutations
        node->aa_mutations.clear();
        
        // Group mutations by codon (like Python's by_codon)
        std::unordered_map<std::string, std::vector<Mutation>> by_codon; // "gene_idx:codon_num" -> mutations
        by_codon.reserve(node->mutations.size()); // Reserve space
        
        for (const auto& mutation : node->mutations) {
            int32_t zero_indexed_pos = mutation.position - 1;
            auto it = nuc_to_codon.find(zero_indexed_pos);
            if (it != nuc_to_codon.end()) {
                for (const auto& codon_info : it->second) {
                    // More efficient key construction
                    std::string key;
                    key.reserve(20); // Most keys will be shorter
                    key = std::to_string(codon_info.first) + ":" + std::to_string(codon_info.second);
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
            
            // Build initial codon from reference sequence
            std::string initial_codon = "";
            std::string final_codon = "";
            
            // For multi-part genes, we need to find the actual genomic positions of the codon
            std::vector<int32_t> codon_positions;
            
            if (!gene.parts.empty()) {
                // Find the three nucleotide positions that make up this codon
                int32_t nucleotide_counter = 0;
                int32_t target_start = codon_number * 3;
                int32_t target_end = target_start + 3;
                
                if (gene.strand == '+') {
                    for (const auto& part : gene.parts) {
                        for (int32_t genome_pos = part.start; genome_pos < part.end; ++genome_pos) {
                            if (nucleotide_counter >= target_start && nucleotide_counter < target_end) {
                                codon_positions.push_back(genome_pos);
                            }
                            nucleotide_counter++;
                            if (nucleotide_counter >= target_end) break;
                        }
                        if (nucleotide_counter >= target_end) break;
                    }
                } else {
                    // For reverse strand, process parts in reverse order
                    for (auto it = gene.parts.rbegin(); it != gene.parts.rend(); ++it) {
                        for (int32_t genome_pos = it->start; genome_pos < it->end; ++genome_pos) {
                            if (nucleotide_counter >= target_start && nucleotide_counter < target_end) {
                                codon_positions.push_back(genome_pos);
                            }
                            nucleotide_counter++;
                            if (nucleotide_counter >= target_end) break;
                        }
                        if (nucleotide_counter >= target_end) break;
                    }
                }
            } else {
                // Fallback for genes without parts
                int32_t codon_start = gene.start + codon_number * 3;
                for (int32_t i = 0; i < 3; ++i) {
                    codon_positions.push_back(codon_start + i);
                }
            }
            
            // Build codons from the positions
            for (int32_t pos : codon_positions) {
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
                int32_t mut_pos = mutation.position - 1; // Convert to 0-indexed
                
                // Find which position in the codon this mutation affects
                for (size_t i = 0; i < codon_positions.size(); ++i) {
                    if (codon_positions[i] == mut_pos && i < final_codon.length()) {
                        final_codon[i] = nuc_to_char(mutation.mut_nuc);
                        break;
                    }
                }
            }
            
            // Handle reverse strand genes
            if (gene.strand == '-') {
                // Reverse complement both codons using lookup table
                auto complement_seq = [](const std::string& seq) {
                    std::string comp;
                    comp.reserve(seq.size());
                    for (char c : seq) {
                        // Direct inline complement
                        char complement = c;
                        switch(c) {
                            case 'A': complement = 'T'; break;
                            case 'T': complement = 'A'; break;
                            case 'C': complement = 'G'; break;
                            case 'G': complement = 'C'; break;
                            case 'a': complement = 't'; break;
                            case 't': complement = 'a'; break;
                            case 'c': complement = 'g'; break;
                            case 'g': complement = 'c'; break;
                        }
                        comp += complement;
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
                // Set nuc_for_codon to the middle nucleotide position of the codon (0-indexed, matching Python)
                if (codon_positions.size() >= 2) {
                    aa_mut.nuc_for_codon = codon_positions[1];  // Middle position, 0-indexed
                } else if (!codon_positions.empty()) {
                    aa_mut.nuc_for_codon = codon_positions[0];  // Fallback to first position
                } else {
                    aa_mut.nuc_for_codon = gene.start + codon_number * 3 + 1;  // Fallback
                }
                node->aa_mutations.push_back(aa_mut);
            }
        }
        
        // Update past mutations dict with current mutations
        std::unordered_map<int32_t, char> new_past_nuc_muts_dict = past_nuc_muts_dict;
        for (const auto& mutation : node->mutations) {
            new_past_nuc_muts_dict[mutation.position - 1] = nuc_to_char(mutation.mut_nuc);
        }
        
        // Report progress
        size_t current = processed_nodes.fetch_add(1) + 1;
        if (progress_callback) {
            progress_callback(current);
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

void Tree::set_gene_details(const std::vector<Gene>& input_genes) {
    // Store genes for later use by JSONLWriter in config output
    this->genes = input_genes;
}

} // namespace taxonium