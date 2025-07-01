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
#include "taxonium/progress_bar.hpp"

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
    bool show_progress = true;
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
        ("no-progress", "Disable progress bars for maximum performance")
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
        opts.show_progress = options.count("no-progress") == 0;
        
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
        std::unique_ptr<Tree> tree;
        
        if (opts.show_progress) {
            ProgressBar parse_progress(1, "Parsing protobuf");
            tree = parser.parse_file(opts.input_file, opts.name_internal_nodes);
            parse_progress.complete();
        } else {
            tree = parser.parse_file(opts.input_file, opts.name_internal_nodes);
        }
        
        // Calculate detailed statistics
        size_t leaf_count = 0;
        size_t internal_count = 0;
        tree->traverse_preorder([&](Node* node) {
            if (node->is_leaf()) leaf_count++;
            else internal_count++;
        });
        
        size_t actual_node_count = leaf_count + internal_count;
        std::cout << "Loaded tree with " << tree->get_num_nodes() << " nodes (" 
                  << leaf_count << " leaves, " << internal_count << " internal)" << std::endl;
        
        // Load metadata if provided
        MetadataReader metadata_reader;
        if (!opts.metadata_file.empty()) {
            std::cout << "Loading metadata: " << opts.metadata_file << std::endl;
            
            auto meta_load_start = std::chrono::high_resolution_clock::now();
            if (opts.show_progress) {
                ProgressBar load_progress(1, "Loading metadata file");
                metadata_reader.load(opts.metadata_file, opts.columns, opts.key_column);
                load_progress.complete();
            } else {
                metadata_reader.load(opts.metadata_file, opts.columns, opts.key_column);
            }
            auto meta_load_end = std::chrono::high_resolution_clock::now();
            auto meta_load_duration = std::chrono::duration_cast<std::chrono::milliseconds>(meta_load_end - meta_load_start);
            std::cout << "⏱️  Metadata loading: " << meta_load_duration.count() / 1000.0 << "s" << std::endl;
            
            auto meta_apply_start = std::chrono::high_resolution_clock::now();
            if (opts.show_progress) {
                ProgressBar metadata_progress(actual_node_count, "Applying metadata");
                metadata_reader.apply_to_tree(tree.get(), [&](size_t current) {
                    metadata_progress.update(current);
                });
                metadata_progress.complete();
            } else {
                metadata_reader.apply_to_tree(tree.get());
            }
            auto meta_apply_end = std::chrono::high_resolution_clock::now();
            auto meta_apply_duration = std::chrono::duration_cast<std::chrono::milliseconds>(meta_apply_end - meta_apply_start);
            std::cout << "⏱️  Metadata application: " << meta_apply_duration.count() / 1000.0 << "s" << std::endl;
        }
        
        // Parse genbank file if provided
        if (!opts.genbank_file.empty()) {
            std::cout << "Loading genbank file: " << opts.genbank_file << std::endl;
            GenbankParser genbank_parser;
            
            auto genbank_start = std::chrono::high_resolution_clock::now();
            if (opts.show_progress) {
                ProgressBar genbank_progress(1, "Parsing genbank file");
                genbank_parser.parse(opts.genbank_file);
                genbank_progress.complete();
            } else {
                genbank_parser.parse(opts.genbank_file);
            }
            auto genbank_end = std::chrono::high_resolution_clock::now();
            auto genbank_duration = std::chrono::duration_cast<std::chrono::milliseconds>(genbank_end - genbank_start);
            std::cout << "⏱️  Genbank parsing: " << genbank_duration.count() / 1000.0 << "s" << std::endl;
            
            auto genes = genbank_parser.get_genes();
            std::cout << "Loaded " << genes.size() << " genes from genbank file" << std::endl;
            
            // Apply gene annotations and generate AA mutations
            std::string reference_sequence = genbank_parser.get_reference_sequence();
            std::cout << "Reference sequence length: " << reference_sequence.length() << std::endl;
            
            auto aa_start = std::chrono::high_resolution_clock::now();
            if (opts.show_progress) {
                ProgressBar aa_progress(actual_node_count, "Annotating amino acid mutations");
                tree->annotate_aa_mutations(genes, reference_sequence, [&](size_t current) {
                    aa_progress.update(current);
                });
                tree->set_gene_details(genes);
                aa_progress.complete();
            } else {
                tree->annotate_aa_mutations(genes, reference_sequence);
                tree->set_gene_details(genes);
            }
            auto aa_end = std::chrono::high_resolution_clock::now();
            auto aa_duration = std::chrono::duration_cast<std::chrono::milliseconds>(aa_end - aa_start);
            std::cout << "⏱️  Amino acid annotation: " << aa_duration.count() / 1000.0 << "s" << std::endl;
        }
        
        // Process tree
        std::cout << "Processing tree..." << std::endl;
        
        auto process_start = std::chrono::high_resolution_clock::now();
        if (opts.show_progress) {
            ProgressBar process_progress(1, "Processing tree structure");
            
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
            
            process_progress.complete();
        } else {
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
        }
        auto process_end = std::chrono::high_resolution_clock::now();
        auto process_duration = std::chrono::duration_cast<std::chrono::milliseconds>(process_end - process_start);
        std::cout << "⏱️  Tree processing: " << process_duration.count() / 1000.0 << "s" << std::endl;
        
        // Filter mutations if requested
        if (opts.only_variable_sites) {
            // TODO: Implement variable site filtering
        }
        
        // Write output
        std::cout << "Writing output to: " << opts.output_file << std::endl;
        JSONLWriter writer(opts.output_file);
        
        auto write_start = std::chrono::high_resolution_clock::now();
        if (opts.show_progress) {
            ProgressBar write_progress(actual_node_count, "Writing JSONL");  
            writer.write_tree(tree.get(), [&](size_t current) {
                write_progress.update(current);
            });
            write_progress.complete();
        } else {
            writer.write_tree(tree.get());
        }
        auto write_end = std::chrono::high_resolution_clock::now();
        auto write_duration = std::chrono::duration_cast<std::chrono::milliseconds>(write_end - write_start);
        std::cout << "⏱️  JSONL writing: " << write_duration.count() / 1000.0 << "s" << std::endl;
        
        auto end_time = std::chrono::high_resolution_clock::now();
        auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end_time - start_time);
        
        std::cout << "Done! Processing took " << duration.count() / 1000.0 << " seconds" << std::endl;
        
    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return 1;
    }
    
    return 0;
}