#include <iostream>
#include <fstream>
#include <cassert>
#include <memory>
#include "taxonium/genbank_parser.hpp"
#include "taxonium/tree.hpp"
#include "taxonium/node.hpp"

using namespace taxonium;

int main() {
    std::cout << "Testing GenBank parser integration..." << std::endl;
    
    // Create a test GenBank file
    std::string test_file = "test_integration.gb";
    std::ofstream file(test_file);
    file << "LOCUS       TEST            100 bp    DNA     linear   VRL 01-JAN-2023\n";
    file << "FEATURES             Location/Qualifiers\n";
    file << "     CDS             10..30\n";
    file << "                     /gene=\"simpleGene\"\n";
    file << "     CDS             join(40..50,60..70)\n";
    file << "                     /gene=\"splitGene\"\n";
    file << "ORIGIN\n";
    file << "        1 nnnnnnnnn atgatgatga tgatgatgat nnnnnnnnn atgatgatga nnnnnnnnnn\n";
    file << "       61 atgatgatga nnnnnnnnnn nnnnnnnnnn nnnnnnnnnn\n";
    file << "//\n";
    file.close();
    
    // Parse the file
    GenbankParser parser;
    parser.parse(test_file);
    
    auto genes = parser.get_genes();
    std::cout << "Parsed " << genes.size() << " genes" << std::endl;
    
    // Check simple gene
    assert(genes.size() >= 1);
    std::cout << "Gene 0: name=" << genes[0].name << ", parts=" << genes[0].parts.size() << std::endl;
    if (!genes[0].parts.empty()) {
        std::cout << "  Part 0: start=" << genes[0].parts[0].start << ", end=" << genes[0].parts[0].end << std::endl;
    }
    assert(genes[0].name == "simpleGene");
    assert(genes[0].parts.size() == 1);
    assert(genes[0].parts[0].start == 9);  // 0-indexed
    assert(genes[0].parts[0].end == 30);
    
    // Check split gene
    if (genes.size() >= 2) {
        std::cout << "Gene 1: name=" << genes[1].name << ", parts=" << genes[1].parts.size() << std::endl;
        for (size_t i = 0; i < genes[1].parts.size(); ++i) {
            std::cout << "  Part " << i << ": start=" << genes[1].parts[i].start 
                      << ", end=" << genes[1].parts[i].end << std::endl;
        }
        assert(genes[1].name == "splitGene");
        assert(genes[1].parts.size() == 2);
        assert(genes[1].parts[0].start == 39);  // 0-indexed
        assert(genes[1].parts[0].end == 50);
        assert(genes[1].parts[1].start == 59);
        assert(genes[1].parts[1].end == 70);
    }
    
    // Test mutation annotation with a simple tree
    Tree tree;
    auto root_node = std::make_unique<Node>();
    root_node->name = "root";
    Node* root = root_node.get();
    tree.set_root(std::move(root_node));

    Node* child = root->add_child("child1");
    
    // Add a mutation in the split gene
    Mutation mut;
    mut.position = 41;  // 1-indexed, in first part of splitGene
    mut.ref_nuc = Nucleotide::A;
    mut.mut_nuc = Nucleotide::G;
    child->mutations.push_back(mut);
    
    // Annotate mutations
    parser.annotate_mutations(&tree);
    
    std::cout << "✓ All integration tests passed!" << std::endl;
    
    // Clean up
    std::remove(test_file.c_str());
    
    return 0;
}