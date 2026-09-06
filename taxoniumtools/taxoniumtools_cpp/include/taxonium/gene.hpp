#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace taxonium {

struct GenePart {
    int32_t start;  // 0-indexed
    int32_t end;    // 0-indexed, exclusive
    bool is_complement;  // True if this part is on the complement strand

    GenePart(int32_t s, int32_t e, bool complement = false)
        : start(s), end(e), is_complement(complement) {}

    int32_t length() const { return end - start; }
};

struct Gene {
    std::string name;
    std::vector<GenePart> parts;  // Ordered list of gene parts
    char strand;    // Overall strand: '+' or '-'
    std::string sequence;  // Protein sequence from translation

    // For backward compatibility with single-part genes
    int32_t start;  // Start of first part (deprecated, use parts[0].start)
    int32_t end;    // End of last part (deprecated, use parts.back().end)

    Gene() : strand('+'), start(0), end(0) {}

    // Constructor for single-part gene (backward compatible)
    Gene(const std::string& n, int32_t s, int32_t e, char str = '+')
        : name(n), strand(str), start(s), end(e) {
        parts.emplace_back(s, e, strand == '-');
    }

    // Get total length in nucleotides across all parts
    int32_t length() const {
        int32_t total = 0;
        for (const auto& part : parts) {
            total += part.length();
        }
        return total;
    }

    // Check if position is within any part of this gene
    bool contains(int32_t position) const {
        for (const auto& part : parts) {
            if (position >= part.start && position < part.end) {
                return true;
            }
        }
        return false;
    }

    // Get the position within the gene (0-based) for a genomic position
    // Returns -1 if position is not within the gene
    int32_t get_gene_position(int32_t genomic_position) const {
        int32_t offset = 0;

        if (strand == '+') {
            // Forward strand: process parts in order
            for (const auto& part : parts) {
                if (genomic_position >= part.start && genomic_position < part.end) {
                    return offset + (genomic_position - part.start);
                }
                offset += part.length();
            }
        } else {
            // Reverse strand: process parts in reverse order
            for (auto it = parts.rbegin(); it != parts.rend(); ++it) {
                if (genomic_position >= it->start && genomic_position < it->end) {
                    // Position from the end of this part
                    return offset + (it->end - 1 - genomic_position);
                }
                offset += it->length();
            }
        }

        return -1;  // Not in gene
    }

    // Get the codon position (0-based) for a gene position
    int32_t get_codon_position(int32_t gene_position) const {
        return gene_position / 3;
    }

    // Get the position within the codon (0, 1, or 2)
    int32_t get_position_in_codon(int32_t gene_position) const {
        return gene_position % 3;
    }
};

} // namespace taxonium
