#pragma once

#include "tree.hpp"
#include "gene.hpp"
#include <string>
#include <vector>

namespace taxonium {

class GenbankParser {
private:
    std::vector<Gene> genes;
    std::string reference_sequence;
    
public:
    GenbankParser() = default;
    
    // Parse a GenBank file
    void parse(const std::string& filename);
    
    // Annotate mutations in the tree with gene information
    void annotate_mutations(Tree* tree);
    
    // Get parsed genes
    std::vector<Gene> get_genes() const;
    
    // Get reference sequence
    std::string get_reference_sequence() const;
};

} // namespace taxonium