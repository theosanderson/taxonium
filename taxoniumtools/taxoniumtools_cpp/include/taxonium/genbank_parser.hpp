#pragma once

#include "tree.hpp"
#include <string>
#include <vector>

namespace taxonium {

struct Gene {
    std::string name;
    int32_t start;  // 0-indexed
    int32_t end;    // 0-indexed, exclusive
    char strand;    // '+' or '-'
    std::string sequence;  // Protein sequence from translation
    
    Gene() : start(0), end(0), strand('+') {}
    
    // Get length in nucleotides
    int32_t length() const { return end - start; }
    
    // Check if position is within this gene
    bool contains(int32_t position) const {
        return position >= start && position < end;
    }
};

class GenbankParser {
private:
    std::vector<Gene> genes;
    
public:
    GenbankParser() = default;
    
    // Parse a GenBank file
    void parse(const std::string& filename);
    
    // Annotate mutations in the tree with gene information
    void annotate_mutations(Tree* tree);
    
    // Get parsed genes
    std::vector<Gene> get_genes() const;
};

} // namespace taxonium