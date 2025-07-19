#include "taxonium/genbank_parser.hpp"
#include <fstream>
#include <sstream>
#include <iostream>
#include <algorithm>
#include <regex>
#include <cctype>

namespace taxonium {

// Helper function to parse a simple range like "100..200"
std::pair<int32_t, int32_t> parse_range(const std::string& range_str) {
    size_t dots = range_str.find("..");
    if (dots == std::string::npos) {
        // Single position (e.g., "100")
        int32_t pos = std::stoi(range_str) - 1;  // Convert to 0-indexed
        return {pos, pos + 1};
    }
    
    // Range (e.g., "100..200")
    int32_t start = std::stoi(range_str.substr(0, dots)) - 1;  // 0-indexed
    int32_t end = std::stoi(range_str.substr(dots + 2));  // Keep as-is (exclusive)
    return {start, end};
}

// Helper function to parse complex location strings
std::vector<GenePart> parse_location(const std::string& location) {
    std::vector<GenePart> parts;
    
    // Check if it's a complement
    bool is_complement = false;
    std::string loc = location;
    
    // Remove whitespace
    loc.erase(std::remove_if(loc.begin(), loc.end(), ::isspace), loc.end());
    
    if (loc.find("complement(") == 0) {
        is_complement = true;
        // Remove "complement(" and the last ")"
        loc = loc.substr(11, loc.length() - 12);
    }
    
    // Check if it's a join
    if (loc.find("join(") == 0) {
        // Remove "join(" and the last ")"
        loc = loc.substr(5, loc.length() - 6);
        
        // Split by commas, but need to handle nested parentheses
        std::vector<std::string> ranges;
        std::string current_range;
        int paren_depth = 0;
        
        for (char c : loc) {
            if (c == '(') {
                paren_depth++;
                current_range += c;
            } else if (c == ')') {
                paren_depth--;
                current_range += c;
            } else if (c == ',' && paren_depth == 0) {
                if (!current_range.empty()) {
                    ranges.push_back(current_range);
                    current_range.clear();
                }
            } else {
                current_range += c;
            }
        }
        if (!current_range.empty()) {
            ranges.push_back(current_range);
        }
        
        // Parse each range
        for (const auto& range : ranges) {
            // Check if this specific part is complemented
            bool part_complement = is_complement;
            std::string range_to_parse = range;
            
            if (range.find("complement(") == 0) {
                part_complement = !part_complement;  // Toggle complement
                range_to_parse = range.substr(11, range.length() - 12);
            }
            
            auto [start, end] = parse_range(range_to_parse);
            parts.emplace_back(start, end, part_complement);
        }
    } else {
        // Simple range
        auto [start, end] = parse_range(loc);
        parts.emplace_back(start, end, is_complement);
    }
    
    return parts;
}

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
                std::getline(ss, location);  // Get the rest of the line
                
                // Trim leading whitespace
                location.erase(0, location.find_first_not_of(" \t"));
                
                // Check if location continues on next lines
                while (!location.empty() && location.back() != ')' && 
                       std::count(location.begin(), location.end(), '(') > 
                       std::count(location.begin(), location.end(), ')')) {
                    std::string next_line;
                    if (std::getline(file, next_line)) {
                        // Should be continuation line starting with spaces
                        if (next_line.size() > 21) {
                            location += next_line.substr(21);
                        }
                    }
                }
                
                // Parse the location
                current_gene.parts = parse_location(location);
                
                // Set strand based on overall complement status
                if (!current_gene.parts.empty()) {
                    // Determine overall strand
                    bool all_complement = true;
                    bool any_complement = false;
                    for (const auto& part : current_gene.parts) {
                        if (part.is_complement) any_complement = true;
                        else all_complement = false;
                    }
                    
                    current_gene.strand = all_complement ? '-' : '+';
                    
                    // Set start and end for backward compatibility
                    current_gene.start = current_gene.parts.front().start;
                    current_gene.end = current_gene.parts.back().end;
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
            } else if (content.find("/locus_tag=") == 0) {
                // Locus tag - use as fallback if no gene name
                if (current_gene.name.empty()) {
                    size_t start = content.find('"') + 1;
                    size_t end = content.rfind('"');
                    if (start < end) {
                        current_gene.name = content.substr(start, end - start);
                    }
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
    // Use the tree's annotate_aa_mutations method
    if (tree && !genes.empty() && !reference_sequence.empty()) {
        tree->annotate_aa_mutations(genes, reference_sequence);
    }
}

std::vector<Gene> GenbankParser::get_genes() const {
    return genes;
}

std::string GenbankParser::get_reference_sequence() const {
    return reference_sequence;
}

} // namespace taxonium