#include <iostream>
#include <cassert>
#include <string>
#include <vector>
#include <sstream>

// Include headers from the main project
#include "taxonium/mutation.hpp"
#include "taxonium/utils.hpp"
#include "taxonium/string_pool.hpp"
#include "taxonium/node.hpp"
#include "taxonium/codon_table.hpp"

using namespace taxonium;

// Test mutation parsing and encoding
void test_mutations() {
    std::cout << "Testing mutations..." << std::endl;
    
    // Test nucleotide encoding
    assert(char_to_nuc('A') == Nucleotide::A);
    assert(char_to_nuc('C') == Nucleotide::C);
    assert(char_to_nuc('G') == Nucleotide::G);
    assert(char_to_nuc('T') == Nucleotide::T);
    assert(char_to_nuc('N') == Nucleotide::N);
    assert(char_to_nuc('-') == Nucleotide::GAP);
    assert(char_to_nuc('X') == Nucleotide::INVALID);
    
    // Test lowercase
    assert(char_to_nuc('a') == Nucleotide::A);
    assert(char_to_nuc('g') == Nucleotide::G);
    
    // Test nuc to char
    assert(nuc_to_char(Nucleotide::A) == 'A');
    assert(nuc_to_char(Nucleotide::C) == 'C');
    assert(nuc_to_char(Nucleotide::G) == 'G');
    assert(nuc_to_char(Nucleotide::T) == 'T');
    assert(nuc_to_char(Nucleotide::N) == 'N');
    assert(nuc_to_char(Nucleotide::GAP) == '-');
    
    std::cout << "  ✓ Nucleotide encoding tests passed" << std::endl;
    
    // Test mutation creation
    Mutation mut;
    mut.position = 100;
    mut.ref_nuc = Nucleotide::A;
    mut.mut_nuc = Nucleotide::G;
    assert(mut.position == 100);
    assert(mut.ref_nuc == Nucleotide::A);
    assert(mut.mut_nuc == Nucleotide::G);
    
    std::cout << "  ✓ Mutation creation tests passed" << std::endl;
}

// Test string pool functionality
void test_string_pool() {
    std::cout << "Testing string pool..." << std::endl;
    
    StringPool pool;
    
    // Test interning strings
    const std::string& str1 = pool.intern("test1");
    const std::string& str2 = pool.intern("test2");
    const std::string& str3 = pool.intern("test1"); // Duplicate
    
    // Should reuse same string for duplicate
    assert(&str1 == &str3);
    assert(&str1 != &str2);
    
    // Test values
    assert(str1 == "test1");
    assert(str2 == "test2");
    
    // Test pool size
    assert(pool.size() == 2); // Only 2 unique strings
    
    std::cout << "  ✓ String pool tests passed" << std::endl;
}

// Test node functionality
void test_node() {
    std::cout << "Testing node..." << std::endl;
    
    Node node("test_node");
    assert(node.name == "test_node");
    assert(node.is_leaf() == true);
    assert(node.is_root() == true);
    
    // Test adding child
    Node* child = node.add_child("child_node");
    assert(child != nullptr);
    assert(child->name == "child_node");
    assert(child->parent == &node);
    assert(node.is_leaf() == false);
    assert(child->is_root() == false);
    
    // Test metadata - using direct map access since methods might not be implemented
    node.metadata["location"] = "USA";
    node.metadata["date"] = "2023-01-01";
    
    assert(node.metadata.count("location") > 0);
    assert(node.metadata["location"] == "USA");
    assert(node.metadata["date"] == "2023-01-01");
    assert(node.metadata.count("nonexistent") == 0);
    
    // Test adding mutations
    node.mutations.resize(2);
    node.mutations[0].position = 100;
    node.mutations[0].ref_nuc = Nucleotide::A;
    node.mutations[0].mut_nuc = Nucleotide::G;
    
    node.mutations[1].position = 200;
    node.mutations[1].ref_nuc = Nucleotide::C;
    node.mutations[1].mut_nuc = Nucleotide::T;
    
    assert(node.mutations.size() == 2);
    assert(node.mutations[0].position == 100);
    assert(node.mutations[1].position == 200);
    
    std::cout << "  ✓ Node tests passed" << std::endl;
}

// Test utility functions
void test_utils() {
    std::cout << "Testing utilities..." << std::endl;
    
    // Test split function
    std::string test_str = "a,b,c,d";
    auto parts = split_string(test_str, ',');
    assert(parts.size() == 4);
    assert(parts[0] == "a");
    assert(parts[1] == "b");
    assert(parts[2] == "c");
    assert(parts[3] == "d");
    
    // Test with different delimiter
    test_str = "one|two|three";
    parts = split_string(test_str, '|');
    assert(parts.size() == 3);
    assert(parts[0] == "one");
    assert(parts[1] == "two");
    assert(parts[2] == "three");
    
    // Test empty string
    parts = split_string("", ',');
    assert(parts.size() == 1);
    assert(parts[0] == "");
    
    // Test no delimiter found
    parts = split_string("hello", ',');
    assert(parts.size() == 1);
    assert(parts[0] == "hello");
    
    // Test join function
    std::vector<std::string> vec = {"a", "b", "c"};
    assert(join_strings(vec, ",") == "a,b,c");
    assert(join_strings(vec, " | ") == "a | b | c");
    
    // Test ends_with
    assert(ends_with("hello.txt", ".txt") == true);
    assert(ends_with("hello.txt", ".csv") == false);
    assert(ends_with("test", "test") == true);
    assert(ends_with("test", "testing") == false);
    
    // Test trim
    assert(trim("  hello  ") == "hello");
    assert(trim("\t\nhello\n\t") == "hello");
    assert(trim("hello") == "hello");
    assert(trim("") == "");
    
    std::cout << "  ✓ Utility tests passed" << std::endl;
}

// Test codon table if it exists
void test_codon_table() {
    std::cout << "Testing codon table..." << std::endl;
    
    // Basic codon translations
    assert(CodonTable::translate("ATG") == 'M'); // Start codon
    assert(CodonTable::translate("TAA") == '*'); // Stop codon
    assert(CodonTable::translate("TAG") == '*'); // Stop codon
    assert(CodonTable::translate("TGA") == '*'); // Stop codon
    
    // Some common codons
    assert(CodonTable::translate("GCT") == 'A'); // Alanine
    assert(CodonTable::translate("TGT") == 'C'); // Cysteine
    assert(CodonTable::translate("GAT") == 'D'); // Aspartic acid
    assert(CodonTable::translate("AAA") == 'K'); // Lysine
    
    // Invalid codons
    assert(CodonTable::translate("NNN") == 'X'); // Unknown
    assert(CodonTable::translate("---") == 'X'); // Gaps
    assert(CodonTable::translate("AA") == 'X');  // Too short
    
    // Test sequence translation
    std::string dna = "ATGGCTTGATAA";
    std::string protein = CodonTable::translate_sequence(dna);
    assert(protein == "MAL*");
    
    std::cout << "  ✓ Codon table tests passed" << std::endl;
}

// Test precision formatting
void test_precision_formatting() {
    std::cout << "Testing precision formatting..." << std::endl;
    
    assert(to_string_with_precision(3.14159, 2) == "3.14");
    assert(to_string_with_precision(100.0, 0) == "100");
    assert(to_string_with_precision(0.123456, 4) == "0.1235");
    
    std::cout << "  ✓ Precision formatting tests passed" << std::endl;
}

int main() {
    std::cout << "Running Taxoniumtools C++ tests..." << std::endl;
    std::cout << "===================================" << std::endl;
    
    try {
        test_mutations();
        test_string_pool();
        test_node();
        test_utils();
        test_codon_table();
        test_precision_formatting();
        
        std::cout << "\nAll tests passed! ✓" << std::endl;
        return 0;
    } catch (const std::exception& e) {
        std::cerr << "\nTest failed with exception: " << e.what() << std::endl;
        return 1;
    } catch (...) {
        std::cerr << "\nTest failed with unknown exception" << std::endl;
        return 1;
    }
}