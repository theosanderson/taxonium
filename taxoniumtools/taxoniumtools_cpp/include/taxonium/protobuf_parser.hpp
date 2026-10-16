#pragma once

#include "tree.hpp"
#include <string>
#include <memory>

// Forward declare protobuf classes
namespace Parsimony {
    class data;
}

namespace taxonium {

class ProtobufParser {
public:
    ProtobufParser() = default;
    
    // Parse a protobuf file and construct a tree
    std::unique_ptr<Tree> parse_file(const std::string& filename, 
                                     bool name_internal_nodes = false);
    
private:
    // Parse newick string and build tree structure
    std::unique_ptr<Node> parse_newick(const std::string& newick);
    
    // Apply mutations from protobuf to tree
    void apply_mutations(Tree* tree, const Parsimony::data& pb_data);
    
    // Apply condensed nodes (collapsed identical sequences)
    void apply_condensed_nodes(Tree* tree, const Parsimony::data& pb_data);
    
    // Apply clade annotations
    void apply_metadata(Tree* tree, const Parsimony::data& pb_data);
    
    // Helper to parse newick string
    struct NewickParser {
        const std::string& newick;
        size_t pos;
        
        NewickParser(const std::string& s) : newick(s), pos(0) {}
        
        std::unique_ptr<Node> parse();
        std::unique_ptr<Node> parse_subtree();
        std::string parse_name();
        double parse_branch_length();
        void skip_whitespace();
    };
};

} // namespace taxonium