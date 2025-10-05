#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace taxonium {

// Nucleotide encoding (matching Usher's encoding)
enum class Nucleotide : int8_t {
    A = 0,
    C = 1,
    G = 2,
    T = 3,
    N = 4,  // Unknown/ambiguous
    GAP = 5,
    INVALID = -1
};

// Convert between character and nucleotide encoding
inline Nucleotide char_to_nuc(char c) {
    switch(c) {
        case 'A': case 'a': return Nucleotide::A;
        case 'C': case 'c': return Nucleotide::C;
        case 'G': case 'g': return Nucleotide::G;
        case 'T': case 't': return Nucleotide::T;
        case 'N': case 'n': return Nucleotide::N;
        case '-': return Nucleotide::GAP;
        default: return Nucleotide::INVALID;
    }
}

inline char nuc_to_char(Nucleotide nuc) {
    switch(nuc) {
        case Nucleotide::A: return 'A';
        case Nucleotide::C: return 'C';
        case Nucleotide::G: return 'G';
        case Nucleotide::T: return 'T';
        case Nucleotide::N: return 'X';  // Python uses 'X' for unknown/root parent
        case Nucleotide::GAP: return '-';
        default: return 'X';
    }
}

// Mutation structure
struct Mutation {
    std::string chromosome;
    int32_t position;
    Nucleotide ref_nuc;
    Nucleotide par_nuc;
    Nucleotide mut_nuc;
    bool is_missing;
    
    Mutation() : position(-1), ref_nuc(Nucleotide::N), 
                 par_nuc(Nucleotide::N), mut_nuc(Nucleotide::N), 
                 is_missing(false) {}
    
    // Check if mutation is masked (unknown position)
    bool is_masked() const { return position < 0; }
    
    // Get string representation (e.g., "A23456T")
    std::string to_string() const;
    
    // Comparison operators for sorting
    bool operator<(const Mutation& other) const {
        if (chromosome != other.chromosome) return chromosome < other.chromosome;
        return position < other.position;
    }
    
    bool operator==(const Mutation& other) const {
        return chromosome == other.chromosome &&
               position == other.position &&
               par_nuc == other.par_nuc &&
               mut_nuc == other.mut_nuc;
    }
};

// Amino acid mutation structure
struct AAMutation {
    std::string gene;
    int32_t codon_position;  // 1-indexed
    std::string ref_aa;
    std::string alt_aa;
    int32_t nuc_for_codon;   // Nucleotide position for the codon (middle position)
    
    AAMutation() : codon_position(0), nuc_for_codon(0) {}
    
    std::string to_string() const;
};

} // namespace taxonium