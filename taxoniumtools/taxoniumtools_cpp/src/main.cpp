#include <iostream>
#include <string>
#include <memory>
#include <fstream>
#include <chrono>

#include "cxxopts.hpp"
#include "taxonium/tree.hpp"
#include "taxonium/protobuf_parser.hpp"
#include "taxonium/jsonl_writer.hpp"
#include "taxonium/metadata_reader.hpp"
#include "taxonium/genbank_parser.hpp"

#ifdef USE_TBB
#include <tbb/global_control.h>
#endif

using namespace taxonium;

struct Options {
    std::string input_file;
    std::string output_file;
    std::string metadata_file;
    std::string genbank_file;
    std::string columns;
    int num_threads = 0;  // 0 = use all available
    bool only_variable_sites = false;
    bool name_internal_nodes = false;
    std::string key_column = "strain";
};

Options parse_arguments(int argc, char* argv[]) {
    Options opts;
    
    cxxopts::Options options("taxoniumtools_cpp", "Convert Usher protobuf to Taxonium JSONL format");
    
    options.add_options()
        ("i,input", "Input Usher protobuf file (.pb / .pb.gz)", "")
        ("o,output", "Output Taxonium JSONL file (.jsonl / .jsonl.gz)", "")
        ("m,metadata", "Metadata TSV file", "")
        ("g,genbank", "GenBank reference file", "")
        ("c,columns", "Comma-separated list of metadata columns", "")
        ("t,threads", "Number of threads (0 = all available)", "0")
        ("only-variable-sites", "Only output variable sites")
        ("name-internal-nodes", "Generate names for internal nodes")
        ("key-column", "Key column in metadata", "strain")
        ("h,help", "Show help");
    
    try {
        options.parse(argc, argv);
        
        if (options.count("help")) {
            options.show_help();
            std::exit(0);
        }
        
        opts.input_file = options["input"];
        opts.output_file = options["output"];
        
        if (opts.input_file.empty() || opts.output_file.empty()) {
            std::cerr << "Error: Input and output files are required\n\n";
            options.show_help();
            std::exit(1);
        }
        opts.metadata_file = options["metadata"];
        opts.genbank_file = options["genbank"];
        opts.columns = options["columns"];
        opts.key_column = options["key-column"];
        opts.num_threads = std::stoi(options["threads"]);
        opts.only_variable_sites = options.count("only-variable-sites") > 0;
        opts.name_internal_nodes = options.count("name-internal-nodes") > 0;
        
    } catch (const std::exception& e) {
        std::cerr << "Error parsing arguments: " << e.what() << "\n";
        std::exit(1);
    }
    
    return opts;
}

int main(int argc, char* argv[]) {
    try {
        auto start_time = std::chrono::high_resolution_clock::now();
        
        // Parse command line arguments
        Options opts = parse_arguments(argc, argv);
        
        // Set up threading
        #ifdef USE_TBB
        std::unique_ptr<tbb::global_control> tbb_control;
        if (opts.num_threads > 0) {
            tbb_control = std::make_unique<tbb::global_control>(
                tbb::global_control::max_allowed_parallelism, opts.num_threads);
        }
        #endif
        
        std::cout << "Loading protobuf file: " << opts.input_file << std::endl;
        
        // Parse protobuf file
        ProtobufParser parser;
        auto tree = parser.parse_file(opts.input_file, opts.name_internal_nodes);
        
        // Calculate detailed statistics
        size_t leaf_count = 0;
        size_t internal_count = 0;
        tree->traverse_preorder([&](Node* node) {
            if (node->is_leaf()) leaf_count++;
            else internal_count++;
        });
        
        std::cout << "Loaded tree with " << tree->get_num_nodes() << " nodes (" 
                  << leaf_count << " leaves, " << internal_count << " internal)" << std::endl;
        
        // Load metadata if provided
        MetadataReader metadata_reader;
        if (!opts.metadata_file.empty()) {
            std::cout << "Loading metadata: " << opts.metadata_file << std::endl;
            metadata_reader.load(opts.metadata_file, opts.columns, opts.key_column);
            metadata_reader.apply_to_tree(tree.get());
        }
        
        // Parse genbank file if provided
        if (!opts.genbank_file.empty()) {
            std::cout << "Loading genbank file: " << opts.genbank_file << std::endl;
            GenbankParser genbank_parser;
            genbank_parser.parse(opts.genbank_file);
            auto genes = genbank_parser.get_genes();
            std::cout << "Loaded " << genes.size() << " genes from genbank file" << std::endl;
            
            // Apply gene annotations and generate AA mutations
            std::string reference_sequence = genbank_parser.get_reference_sequence();
            std::cout << "Reference sequence length: " << reference_sequence.length() << std::endl;
            tree->annotate_aa_mutations(genes, reference_sequence);
            tree->set_gene_details(genes);
        }
        
        // Process tree
        std::cout << "Processing tree..." << std::endl;
        
        // First calculate number of tips for ladderizing
        tree->get_root()->calculate_num_tips();
        
        // Set edge lengths based on mutation count (needed for ladderizing)
        tree->traverse_preorder([](Node* node) {
            node->edge_length = static_cast<double>(node->mutations.size());
        });
        
        // Ladderize tree
        tree->ladderize(false);  // descending order
        
        // Calculate coordinates
        tree->calculate_coordinates();
        
        // Filter mutations if requested
        if (opts.only_variable_sites) {
            // TODO: Implement variable site filtering
        }
        
        // Write output
        std::cout << "Writing output to: " << opts.output_file << std::endl;
        JSONLWriter writer(opts.output_file);
        writer.write_tree(tree.get());
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        std::cout << "Done! Processing took " << duration.count() / 1000.0 << " seconds" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}