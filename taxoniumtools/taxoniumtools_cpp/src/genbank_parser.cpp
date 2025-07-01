#include "taxonium/genbank_parser.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <regex>

namespace taxonium {

void GenbankParser::parse(const std::string& filename) {
    std::ifstream file(filename);
    if (!file) {
        throw std::runtime_error("Cannot open genbank file: " + filename);
    }
    
    std::string line;
    std::string current_feature_type;
    Gene current_gene;
    bool in_feature = false;
    bool in_translation = false;
    std::string translation;
    
    while (std::getline(file, line)) {
        // Remove trailing whitespace
        line.erase(line.find_last_not_of(" \t\r\n") + 1);
        
        if (line.empty()) continue;
        
        // Check for sequence start (end of features)
        if (line.find("ORIGIN") == 0) {
            // Parse the DNA sequence
            while (std::getline(file, line)) {
                if (line.find("//") == 0) break;  // End of file
                
                // Extract sequence from lines like: "        1 gatttttaag ctt..."
                std::stringstream ss(line);
                std::string token;
                ss >> token;  // Skip line number
                
                while (ss >> token) {
                    // Remove any digits and whitespace, keep only letters
                    for (char c : token) {
                        if (std::isalpha(c)) {
                            reference_sequence += std::toupper(c);
                        }
                    }
                }
            }
            break;
        }
        
        // Check for new feature
        if (line.size() > 5 && line[5] != ' ') {
            // Save previous gene if it was a CDS
            if (in_feature && current_feature_type == "CDS" && !current_gene.name.empty()) {
                genes.push_back(current_gene);
            }
            
            in_feature = false;
            in_translation = false;
            current_gene = Gene();
            
            // Parse feature type and location
            std::stringstream ss(line);
            ss >> current_feature_type;
            
            if (current_feature_type == "CDS") {
                in_feature = true;
                std::string location;
                ss >> location;
                
                // Parse location (simple cases only for now)
                // Format: start..end or complement(start..end)
                bool complement = false;
                if (location.find("complement") != std::string::npos) {
                    complement = true;
                    location = location.substr(11, location.length() - 12);  // Remove "complement(" and ")"
                }
                
                size_t dots = location.find("..");
                if (dots != std::string::npos) {
                    // GenBank uses 1-indexed coordinates, convert to 0-indexed
                    current_gene.start = std::stoi(location.substr(0, dots)) - 1;
                    current_gene.end = std::stoi(location.substr(dots + 2));  // End is exclusive, so keep as-is
                    current_gene.strand = complement ? '-' : '+';
                }
            }
        } else if (in_feature && line.size() > 21) {
            // Parse feature qualifiers
            std::string content = line.substr(21);
            
            if (in_translation) {
                if (content.find('"') != std::string::npos) {
                    // End of translation
                    translation += content.substr(0, content.find('"'));
                    current_gene.sequence = translation;
                    in_translation = false;
                } else {
                    translation += content;
                }
            } else if (content.find("/gene=") == 0) {
                // Gene name
                size_t start = content.find('"') + 1;
                size_t end = content.rfind('"');
                if (start < end) {
                    current_gene.name = content.substr(start, end - start);
                }
            } else if (content.find("/translation=") == 0) {
                // Protein translation
                size_t start = content.find('"') + 1;
                if (content.rfind('"') == start - 1 || content.rfind('"') == std::string::npos) {
                    // Multi-line translation
                    in_translation = true;
                    translation = content.substr(start);
                } else {
                    // Single line translation
                    size_t end = content.rfind('"');
                    current_gene.sequence = content.substr(start, end - start);
                }
            }
        }
    }
    
    // Save last gene if needed
    if (in_feature && current_feature_type == "CDS" && !current_gene.name.empty()) {
        genes.push_back(current_gene);
    }
    
    std::cout << "Loaded " << genes.size() << " genes from genbank file" << std::endl;
}

void GenbankParser::annotate_mutations(Tree* tree) {
    // This would annotate mutations with gene information
    // For now, this is a placeholder
    // TODO: Implement amino acid mutation annotation based on gene positions
}

std::vector<Gene> GenbankParser::get_genes() const {
    return genes;
}

std::string GenbankParser::get_reference_sequence() const {
    return reference_sequence;
}

} // namespace taxonium