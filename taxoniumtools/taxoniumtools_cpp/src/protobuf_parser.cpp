#include "taxonium/protobuf_parser.hpp"
#include "taxonium/string_pool.hpp"
#include "parsimony.pb.h"
#include <fstream>
#include <iostream>
#include <sstream>
#include <stack>
#include <google/protobuf/io/zero_copy_stream_impl.h>
#include <google/protobuf/io/gzip_stream.h>

namespace taxonium {

std::unique_ptr<Tree> ProtobufParser::parse_file(const std::string& filename, 
                                                  bool name_internal_nodes) {
    // Open file
    std::ifstream file(filename, std::ios::binary);
    if (!file) {
        throw std::runtime_error("Cannot open file: " + filename);
    }
    
    // Create protobuf input stream
    google::protobuf::io::IstreamInputStream raw_input(&file);
    google::protobuf::io::GzipInputStream* gzip_input = nullptr;
    google::protobuf::io::ZeroCopyInputStream* input = &raw_input;
    
    // Check if file is gzipped
    if (filename.find(".gz") != std::string::npos) {
        gzip_input = new google::protobuf::io::GzipInputStream(&raw_input);
        input = gzip_input;
    }
    
    // Parse protobuf
    Parsimony::data pb_data;
    if (!pb_data.ParseFromZeroCopyStream(input)) {
        delete gzip_input;
        throw std::runtime_error("Failed to parse protobuf file");
    }
    
    delete gzip_input;
    
    // Parse newick string
    auto tree = std::make_unique<Tree>();
    auto root = parse_newick(pb_data.newick());
    tree->set_root(std::move(root));
    
    // Apply mutations
    apply_mutations(tree.get(), pb_data);
    
    // Apply condensed nodes
    apply_condensed_nodes(tree.get(), pb_data);
    
    // Apply metadata
    apply_metadata(tree.get(), pb_data);
    
    // Name internal nodes if requested
    if (name_internal_nodes) {
        size_t internal_count = 0;
        tree->traverse_preorder([&](Node* node) {
            if (!node->is_leaf() && node->name.empty()) {
                node->name = "internal_" + std::to_string(internal_count++);
            }
        });
    }
    
    return tree;
}

std::unique_ptr<Node> ProtobufParser::parse_newick(const std::string& newick) {
    NewickParser parser(newick);
    return parser.parse();
}

void ProtobufParser::apply_mutations(Tree* tree, const Parsimony::data& pb_data) {
    // Get nodes in preorder (matching protobuf order)
    auto nodes = tree->get_nodes_depth_first();
    
    if (nodes.size() != pb_data.node_mutations_size()) {
        throw std::runtime_error("Number of nodes doesn't match number of mutation lists");
    }
    
    // Apply mutations to each node
    for (size_t i = 0; i < nodes.size(); ++i) {
        Node* node = nodes[i];
        const auto& mutation_list = pb_data.node_mutations(i);
        
        for (const auto& mut : mutation_list.mutation()) {
            Mutation m;
            m.position = mut.position();
            m.ref_nuc = static_cast<Nucleotide>(mut.ref_nuc());
            m.par_nuc = static_cast<Nucleotide>(mut.par_nuc());
            
            // Handle multiple possible mutations
            if (mut.mut_nuc_size() > 0) {
                m.mut_nuc = static_cast<Nucleotide>(mut.mut_nuc(0));
            } else {
                m.mut_nuc = m.par_nuc;  // No mutation
            }
            
            if (!mut.chromosome().empty()) {
                m.chromosome = mut.chromosome();
            }
            
            node->mutations.push_back(m);
        }
        
        // Sort mutations by position
        std::sort(node->mutations.begin(), node->mutations.end());
    }
}

void ProtobufParser::apply_condensed_nodes(Tree* tree, const Parsimony::data& pb_data) {
    // Expand condensed nodes by replacing them with sibling nodes
    size_t expanded_count = 0;
    size_t new_nodes_count = 0;
    
    // Collect nodes to expand (can't modify tree while iterating)
    std::vector<std::pair<Node*, const Parsimony::condensed_node*>> to_expand;
    
    for (const auto& condensed : pb_data.condensed_nodes()) {
        Node* node = tree->find_node(condensed.node_name());
        if (node && node->is_leaf() && node->mutations.empty()) {
            to_expand.push_back({node, &condensed});
            expanded_count++;
        }
    }
    
    // Expand each condensed node
    for (const auto& pair : to_expand) {
        Node* node = pair.first;
        const Parsimony::condensed_node* condensed = pair.second;
        Node* parent = node->parent;
        if (!parent) continue;  // Skip root
        
        // Add new nodes as siblings
        for (const auto& leaf_name : condensed->condensed_leaves()) {
            Node* new_leaf = parent->add_child(leaf_name);
            new_nodes_count++;
            // New leaves inherit mutations from their parent, not the condensed node
        }
        
        // Remove the original condensed node
        auto it = std::find_if(parent->children.begin(), parent->children.end(),
                                [node](const std::unique_ptr<Node>& child) {
                                    return child.get() == node;
                                });
        if (it != parent->children.end()) {
            parent->children.erase(it);
        }
    }
    
    std::cout << "Expanded " << expanded_count << " condensed nodes into " 
              << new_nodes_count << " new leaves" << std::endl;
    
    // Rebuild node map after expansion
    tree->build_node_map();
}

void ProtobufParser::apply_metadata(Tree* tree, const Parsimony::data& pb_data) {
    auto nodes = tree->get_nodes_depth_first();
    
    if (pb_data.metadata_size() != nodes.size()) {
        return;  // Metadata is optional
    }
    
    for (size_t i = 0; i < nodes.size(); ++i) {
        Node* node = nodes[i];
        const auto& metadata = pb_data.metadata(i);
        
        for (const auto& annotation : metadata.clade_annotations()) {
            node->clade_annotations.push_back(annotation);
        }
    }
}

// NewickParser implementation
std::unique_ptr<Node> ProtobufParser::NewickParser::parse() {
    auto root = parse_subtree();
    skip_whitespace();
    if (pos < newick.size() && newick[pos] == ';') {
        pos++;  // Skip semicolon
    }
    return root;
}

std::unique_ptr<Node> ProtobufParser::NewickParser::parse_subtree() {
    skip_whitespace();
    
    auto node = std::make_unique<Node>();
    
    if (pos < newick.size() && newick[pos] == '(') {
        // Internal node
        pos++;  // Skip '('
        
        // Parse children
        while (true) {
            auto child = parse_subtree();
            child->parent = node.get();
            node->children.push_back(std::move(child));
            
            skip_whitespace();
            if (pos >= newick.size() || newick[pos] != ',') {
                break;
            }
            pos++;  // Skip ','
        }
        
        if (pos < newick.size() && newick[pos] == ')') {
            pos++;  // Skip ')'
        }
    }
    
    // Parse name and branch length
    node->name = parse_name();
    
    if (pos < newick.size() && newick[pos] == ':') {
        pos++;  // Skip ':'
        node->x_coord = parse_branch_length();  // Store branch length temporarily
    }
    
    return node;
}

std::string ProtobufParser::NewickParser::parse_name() {
    skip_whitespace();
    
    std::string name;
    bool quoted = false;
    
    if (pos < newick.size() && newick[pos] == '\'') {
        quoted = true;
        pos++;  // Skip opening quote
    }
    
    while (pos < newick.size()) {
        char c = newick[pos];
        
        if (quoted) {
            if (c == '\'') {
                pos++;  // Skip closing quote
                break;
            }
        } else {
            if (c == '(' || c == ')' || c == ',' || c == ':' || c == ';' || 
                c == ' ' || c == '\t' || c == '\n' || c == '\r') {
                break;
            }
        }
        
        name += c;
        pos++;
    }
    
    return name;
}

double ProtobufParser::NewickParser::parse_branch_length() {
    skip_whitespace();
    
    size_t start = pos;
    while (pos < newick.size() && 
           (std::isdigit(newick[pos]) || newick[pos] == '.' || 
            newick[pos] == 'e' || newick[pos] == 'E' || 
            newick[pos] == '+' || newick[pos] == '-')) {
        pos++;
    }
    
    std::string length_str = newick.substr(start, pos - start);
    return length_str.empty() ? 0.0 : std::stod(length_str);
}

void ProtobufParser::NewickParser::skip_whitespace() {
    while (pos < newick.size() && 
           (newick[pos] == ' ' || newick[pos] == '\t' || 
            newick[pos] == '\n' || newick[pos] == '\r')) {
        pos++;
    }
}

} // namespace taxonium