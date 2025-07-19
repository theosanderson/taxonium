#pragma once

#include <string>
#include <unordered_map>

namespace taxonium {

// Standard genetic code codon table
class CodonTable {
private:
    static std::unordered_map<std::string, char> codon_to_aa;
    static bool initialized;
    
    static void initialize() {
        if (initialized) return;
        
        // Standard genetic code
        const std::string bases = "TCAG";
        const std::string amino_acids = "FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG";
        
        int index = 0;
        for (char first : bases) {
            for (char second : bases) {
                for (char third : bases) {
                    std::string codon = {first, second, third};
                    codon_to_aa[codon] = amino_acids[index++];
                }
            }
        }
        
        initialized = true;
    }
    
public:
    static char translate(const std::string& codon) {
        initialize();
        
        if (codon.length() != 3) return 'X';
        
        // Handle ambiguous nucleotides
        for (char c : codon) {
            if (c != 'A' && c != 'C' && c != 'G' && c != 'T') {
                return 'X';
            }
        }
        
        auto it = codon_to_aa.find(codon);
        return (it != codon_to_aa.end()) ? it->second : 'X';
    }
    
    static std::string translate_sequence(const std::string& dna) {
        std::string protein;
        for (size_t i = 0; i + 2 < dna.length(); i += 3) {
            protein += translate(dna.substr(i, 3));
        }
        return protein;
    }
};


} // namespace taxonium