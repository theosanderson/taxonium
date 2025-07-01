#include <iostream>
#include "taxonium/tree.hpp"
#include "taxonium/protobuf_parser.hpp"
#include "taxonium/genbank_parser.hpp"

int main() {
    taxonium::ProtobufParser parser;
    auto tree = parser.parse_file("test_data/tfci.pb", false);
    
    taxonium::GenbankParser genbank_parser;
    genbank_parser.parse("test_data/hu1.gb");
    auto genes = genbank_parser.get_genes();
    std::string reference_sequence = genbank_parser.get_reference_sequence();
    
    tree->annotate_aa_mutations(genes, reference_sequence);
    
    // Check if any nodes have AA mutations
    int nodes_with_aa = 0;
    int total_aa_muts = 0;
    tree->traverse_preorder([&](taxonium::Node* node) {
        if (\!node->aa_mutations.empty()) {
            nodes_with_aa++;
            total_aa_muts += node->aa_mutations.size();
            if (nodes_with_aa <= 3) {
                std::cout << "Node " << node->name << " has " << node->aa_mutations.size() << " AA mutations" << std::endl;
            }
        }
    });
    
    std::cout << "Total nodes with AA mutations: " << nodes_with_aa << std::endl;
    std::cout << "Total AA mutations: " << total_aa_muts << std::endl;
    
    return 0;
}
EOF < /dev/null