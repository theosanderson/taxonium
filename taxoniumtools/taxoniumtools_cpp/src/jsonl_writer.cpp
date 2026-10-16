#include "taxonium/jsonl_writer.hpp"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <iomanip>
#include <chrono>
#include <ctime>
#include <map>
#include <tuple>
#include <set>
#include <cmath>
#include <yyjson.h>

#ifdef USE_TBB
#include <tbb/parallel_for.h>
#include <tbb/concurrent_vector.h>
#include <tbb/parallel_sort.h>
#endif

#ifdef USE_BOOST
#include <boost/iostreams/filtering_stream.hpp>
#include <boost/iostreams/filter/gzip.hpp>
#endif

namespace taxonium {

JSONLWriter::JSONLWriter(const std::string& filename) {
    is_gzipped = filename.find(".gz") != std::string::npos;
    
    if (is_gzipped) {
#ifdef USE_BOOST
        auto* file_stream = new std::ofstream(filename, std::ios::binary);
        auto* filtering_stream = new boost::iostreams::filtering_ostream();
        filtering_stream->push(boost::iostreams::gzip_compressor());
        filtering_stream->push(*file_stream);
        output_stream.reset(filtering_stream);
#else
        throw std::runtime_error("Gzip output requested but Boost not available");
#endif
    } else {
        output_stream = std::make_unique<std::ofstream>(filename);
    }
    
    if (!*output_stream) {
        throw std::runtime_error("Cannot open output file: " + filename);
    }
}

JSONLWriter::~JSONLWriter() {
    close();
}

void JSONLWriter::close() {
    if (output_stream) {
        output_stream->flush();
        output_stream.reset();  // This triggers destructor which finalizes gzip
    }
}

void JSONLWriter::write_tree(Tree* tree, std::function<void(size_t)> progress_callback) {
    // Calculate all necessary properties
    tree->calculate_coordinates();
    
    // Write header
    write_header(tree);
    
    // Get nodes sorted by y coordinate
    auto nodes = tree->get_nodes_sorted_by_y();
    
    // Create node to index map
    std::unordered_map<Node*, size_t> node_to_index;
    for (size_t i = 0; i < nodes.size(); ++i) {
        node_to_index[nodes[i]] = i;
    }
    
    // Write each node
#ifdef USE_TBB
    // Parallel JSON generation with chunked processing
    const size_t chunk_size = 50000;  // Smaller chunks
    
    for (size_t start = 0; start < nodes.size(); start += chunk_size) {
        size_t end = std::min(start + chunk_size, nodes.size());
        size_t chunk_len = end - start;
        
        // Pre-allocate storage for this chunk
        std::vector<std::string> json_strings(chunk_len);
        
        // Generate JSON strings in parallel
        tbb::parallel_for(size_t(0), chunk_len,
            [&](size_t local_idx) {
                size_t global_idx = start + local_idx;
                std::ostringstream oss;
                write_node_to_stream(nodes[global_idx], global_idx, node_to_index, oss);
                json_strings[local_idx] = oss.str();
            });
        
        // Write chunk to file sequentially
        for (const auto& json_str : json_strings) {
            *output_stream << json_str;
        }
        
        // Report progress for this chunk
        if (progress_callback) {
            progress_callback(end);
        }
    }
#else
    // Sequential fallback
    for (size_t i = 0; i < nodes.size(); ++i) {
        write_node(nodes[i], i, node_to_index);
        if (progress_callback) {
            progress_callback(i + 1);
        }
    }
#endif
    
    output_stream->flush();
}

void JSONLWriter::write_header(Tree* tree) {
    // Create yyjson document
    yyjson_mut_doc* doc = yyjson_mut_doc_new(nullptr);
    yyjson_mut_val* root = yyjson_mut_obj(doc);
    yyjson_mut_doc_set_root(doc, root);
    
    // Version (matching Python's "dev" for equivalence testing)
    yyjson_mut_obj_add_str(doc, root, "version", "dev");
    
    // Collect all mutations following Python's approach
    std::vector<Mutation> all_nt_mutations;
    std::vector<AAMutation> all_aa_mutations;
    std::set<std::string> seen_mutations;

    // First pass: collect all unique mutations (like Python's get_all_aa_muts and get_all_nuc_muts)
    tree->traverse_preorder([&](Node* node) {
        // Collect nucleotide mutations
        for (const auto& mut : node->mutations) {
            std::string key = mutation_to_key(mut);
            if (seen_mutations.find(key) == seen_mutations.end()) {
                seen_mutations.insert(key);
                all_nt_mutations.push_back(mut);
            }
        }

        // Collect amino acid mutations
        for (const auto& aa_mut : node->aa_mutations) {
            std::string key = aa_mutation_to_key(aa_mut);
            if (seen_mutations.find(key) == seen_mutations.end()) {
                seen_mutations.insert(key);
                all_aa_mutations.push_back(aa_mut);
            }
        }
    });

    // Sort for deterministic output (matching Python's sorted approach)
    // AA mutations: sort by gene, position, ref_aa, alt_aa
    std::sort(all_aa_mutations.begin(), all_aa_mutations.end(),
              [](const AAMutation& a, const AAMutation& b) {
                  if (a.gene != b.gene) return a.gene < b.gene;
                  if (a.codon_position != b.codon_position) return a.codon_position < b.codon_position;
                  if (a.ref_aa != b.ref_aa) return a.ref_aa < b.ref_aa;
                  return a.alt_aa < b.alt_aa;
              });

    // NT mutations: sort by chromosome, position, par_nuc, mut_nuc
    std::sort(all_nt_mutations.begin(), all_nt_mutations.end(),
              [](const Mutation& a, const Mutation& b) {
                  if (a.chromosome != b.chromosome) return a.chromosome < b.chromosome;
                  if (a.position != b.position) return a.position < b.position;
                  if (a.par_nuc != b.par_nuc) return a.par_nuc < b.par_nuc;
                  return a.mut_nuc < b.mut_nuc;
              });
    
    // Second pass: create sequential index mapping (like Python's enumerate(all_mut_inputs))
    size_t index = 0;
    
    // Add AA mutations first (to match Python order)
    for (const auto& aa_mut : all_aa_mutations) {
        std::string key = aa_mutation_to_key(aa_mut);
        mutation_content_to_index[key] = index++;
    }
    
    // Add NT mutations second 
    for (const auto& mut : all_nt_mutations) {
        std::string key = mutation_to_key(mut);
        mutation_content_to_index[key] = index++;
    }
    
    // Create mutations array
    yyjson_mut_val* mutations = yyjson_mut_arr(doc);
    size_t mut_index = 0;
    
    // Add AA mutations first (to match Python order)
    for (const auto& aa_mut : all_aa_mutations) {
        yyjson_mut_val* mut_obj = aa_mutation_to_yyjson(aa_mut, mut_index, doc);
        yyjson_mut_arr_append(mutations, mut_obj);
        mut_index++;
    }
    
    // Add NT mutations second
    for (const auto& mut : all_nt_mutations) {
        yyjson_mut_val* mut_obj = mutation_to_yyjson(mut, mut_index, doc);
        yyjson_mut_arr_append(mutations, mut_obj);
        mut_index++;
    }
    
    yyjson_mut_obj_add_val(doc, root, "mutations", mutations);
    
    // Total nodes - count from sorted list
    auto all_nodes = tree->get_nodes_sorted_by_y();
    yyjson_mut_obj_add_uint(doc, root, "total_nodes", all_nodes.size());
    
    // Config object
    yyjson_mut_val* config = yyjson_mut_obj(doc);

    // Gene details (if available) - must come first to match Python's dict ordering
    const auto& genes = tree->get_genes();
    if (!genes.empty()) {
        yyjson_mut_val* gene_details = yyjson_mut_obj(doc);
        for (const auto& gene : genes) {
            yyjson_mut_val* gene_obj = yyjson_mut_obj(doc);
            yyjson_mut_obj_add_str(doc, gene_obj, "name", gene.name.c_str());
            yyjson_mut_obj_add_int(doc, gene_obj, "strand", gene.strand == '+' ? 1 : -1);
            yyjson_mut_obj_add_int(doc, gene_obj, "start", gene.start);
            yyjson_mut_obj_add_int(doc, gene_obj, "end", gene.end);

            yyjson_mut_obj_add_val(doc, gene_details, gene.name.c_str(), gene_obj);
        }
        yyjson_mut_obj_add_val(doc, config, "gene_details", gene_details);
    }

    yyjson_mut_obj_add_uint(doc, config, "num_tips", tree->get_num_tips());

    // Date created
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::tm tm = *std::localtime(&time_t);
    std::stringstream date_ss;
    date_ss << std::put_time(&tm, "%Y-%m-%d");
    std::string date_str = date_ss.str();
    yyjson_mut_val* date_val = yyjson_mut_str(doc, date_str.c_str());
    yyjson_mut_obj_add_val(doc, config, "date_created", date_val);

    yyjson_mut_obj_add_val(doc, root, "config", config);
    
    // Write to stream
    const char* json_str = yyjson_mut_write(doc, 0, nullptr);
    *output_stream << json_str << "\n";
    
    // Cleanup
    free((void*)json_str);
    yyjson_mut_doc_free(doc);
}

void JSONLWriter::write_node(Node* node, size_t node_index,
                             const std::unordered_map<Node*, size_t>& node_to_index) {
    write_node_to_stream(node, node_index, node_to_index, *output_stream);
}

void JSONLWriter::write_node_to_stream(Node* node, size_t node_index,
                                       const std::unordered_map<Node*, size_t>& node_to_index,
                                       std::ostream& stream) {
    // Create yyjson document for this node
    yyjson_mut_doc* doc = yyjson_mut_doc_new(nullptr);
    yyjson_mut_val* root = yyjson_mut_obj(doc);
    yyjson_mut_doc_set_root(doc, root);
    
    // Name (always include)
    const char* name_str = node->name.empty() ? "" : node->name.c_str();
    yyjson_mut_obj_add_str(doc, root, "name", name_str);
    
    // Coordinates - round to 5 decimal places to match Python
    double rounded_x = std::round(node->x_coord * 100000.0) / 100000.0;
    yyjson_mut_obj_add_real(doc, root, "x_dist", rounded_x);
    
    // Y coordinate - output as integer for leaves to match Python
    if (node->is_leaf()) {
        yyjson_mut_obj_add_int(doc, root, "y", static_cast<int>(node->y_coord));
    } else {
        yyjson_mut_obj_add_real(doc, root, "y", node->y_coord);
    }
    
    // Mutations (as indices) - always include even if empty
    yyjson_mut_val* mutations = yyjson_mut_arr(doc);

    // Collect all mutation indices first
    std::vector<size_t> mutation_indices;
    mutation_indices.reserve(node->aa_mutations.size() + node->mutations.size());

    // Collect amino acid mutation indices
    for (const auto& aa_mut : node->aa_mutations) {
        std::string key = aa_mutation_to_key(aa_mut);
        auto it = mutation_content_to_index.find(key);
        if (it != mutation_content_to_index.end()) {
            mutation_indices.push_back(it->second);
        }
    }

    // Collect nucleotide mutation indices
    for (const auto& mut : node->mutations) {
        std::string key = mutation_to_key(mut);
        auto it = mutation_content_to_index.find(key);
        if (it != mutation_content_to_index.end()) {
            mutation_indices.push_back(it->second);
        }
    }

    // Sort by index to ensure deterministic output matching the global sorted mutation order
    std::sort(mutation_indices.begin(), mutation_indices.end());

    // Write sorted indices
    for (size_t idx : mutation_indices) {
        yyjson_mut_arr_add_uint(doc, mutations, idx);
    }

    yyjson_mut_obj_add_val(doc, root, "mutations", mutations);
    
    // Is tip
    yyjson_mut_obj_add_bool(doc, root, "is_tip", node->is_leaf());
    
    // Parent - for root node, parent_id equals its own node_id
    if (node->parent) {
        auto it = node_to_index.find(node->parent);
        if (it != node_to_index.end()) {
            yyjson_mut_obj_add_uint(doc, root, "parent_id", it->second);
        }
    } else {
        // Root node: parent_id equals its own node_id
        yyjson_mut_obj_add_uint(doc, root, "parent_id", node_index);
    }
    
    // Node ID
    yyjson_mut_obj_add_uint(doc, root, "node_id", node_index);
    
    // Number of tips
    yyjson_mut_obj_add_uint(doc, root, "num_tips", node->num_tips);

    // Metadata - output all columns (matching Python behavior)
    // Python outputs empty strings for missing/empty metadata values
    for (const auto& col : metadata_columns) {
        std::string meta_key = "meta_" + col;
        std::string value = "";

        // Check if node has this metadata field
        auto it = node->metadata.find(col);
        if (it != node->metadata.end()) {
            value = it->second;
        }

        // Always output the field (even if empty) to match Python
        yyjson_mut_val* key_val = yyjson_mut_strcpy(doc, meta_key.c_str());
        yyjson_mut_val* val_val = yyjson_mut_strcpy(doc, value.c_str());
        yyjson_mut_obj_add(root, key_val, val_val);
    }
    
    // Write to stream
    const char* json_str = yyjson_mut_write(doc, 0, nullptr);
    stream << json_str << "\n";
    
    // Cleanup
    free((void*)json_str);
    yyjson_mut_doc_free(doc);
}

std::string JSONLWriter::mutation_to_json(const Mutation& mut, size_t index) {
    std::stringstream ss;
    ss << "{";
    
    ss << "\"gene\":\"nt\",";  // nucleotide mutation type
    ss << "\"previous_residue\":\"" << nuc_to_char(mut.par_nuc) << "\",";
    ss << "\"residue_pos\":" << mut.position << ",";
    ss << "\"new_residue\":\"" << nuc_to_char(mut.mut_nuc) << "\",";
    ss << "\"mutation_id\":" << index << ",";
    ss << "\"type\":\"nt\"";
    
    ss << "}";
    return ss.str();
}

std::string JSONLWriter::aa_mutation_to_json(const AAMutation& aa_mut, size_t index) {
    std::stringstream ss;
    ss << "{";
    
    ss << "\"gene\":\"" << escape_json(aa_mut.gene) << "\",";
    ss << "\"previous_residue\":\"" << escape_json(aa_mut.ref_aa) << "\",";
    ss << "\"residue_pos\":" << aa_mut.codon_position << ",";
    ss << "\"new_residue\":\"" << escape_json(aa_mut.alt_aa) << "\",";
    ss << "\"mutation_id\":" << index << ",";
    ss << "\"nuc_for_codon\":" << aa_mut.nuc_for_codon << ",";
    ss << "\"type\":\"aa\"";
    
    ss << "}";
    return ss.str();
}

yyjson_mut_val* JSONLWriter::mutation_to_yyjson(const Mutation& mut, size_t index, yyjson_mut_doc* doc) {
    yyjson_mut_val* obj = yyjson_mut_obj(doc);
    
    yyjson_mut_obj_add_str(doc, obj, "gene", "nt");
    
    // Convert nucleotides to strings  
    std::string prev_residue_str(1, nuc_to_char(mut.par_nuc));
    std::string new_residue_str(1, nuc_to_char(mut.mut_nuc));
    
    // Add string values directly (yyjson will copy them)
    yyjson_mut_obj_add_strcpy(doc, obj, "previous_residue", prev_residue_str.c_str());
    yyjson_mut_obj_add_uint(doc, obj, "residue_pos", mut.position);
    yyjson_mut_obj_add_strcpy(doc, obj, "new_residue", new_residue_str.c_str());
    yyjson_mut_obj_add_uint(doc, obj, "mutation_id", index);
    yyjson_mut_obj_add_str(doc, obj, "type", "nt");
    
    return obj;
}

yyjson_mut_val* JSONLWriter::aa_mutation_to_yyjson(const AAMutation& aa_mut, size_t index, yyjson_mut_doc* doc) {
    yyjson_mut_val* obj = yyjson_mut_obj(doc);
    
    yyjson_mut_obj_add_str(doc, obj, "gene", aa_mut.gene.c_str());
    yyjson_mut_obj_add_str(doc, obj, "previous_residue", aa_mut.ref_aa.c_str());
    yyjson_mut_obj_add_uint(doc, obj, "residue_pos", aa_mut.codon_position);
    yyjson_mut_obj_add_str(doc, obj, "new_residue", aa_mut.alt_aa.c_str());
    yyjson_mut_obj_add_uint(doc, obj, "mutation_id", index);
    yyjson_mut_obj_add_uint(doc, obj, "nuc_for_codon", aa_mut.nuc_for_codon);
    yyjson_mut_obj_add_str(doc, obj, "type", "aa");
    
    return obj;
}

std::string JSONLWriter::escape_json(const std::string& s) {
    std::stringstream ss;
    for (char c : s) {
        switch (c) {
            case '"': ss << "\\\""; break;
            case '\\': ss << "\\\\"; break;
            case '\b': ss << "\\b"; break;
            case '\f': ss << "\\f"; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            default:
                if (c >= 0x20) {
                    ss << c;
                } else {
                    ss << "\\u" << std::hex << std::setw(4) << std::setfill('0') << (int)c;
                }
        }
    }
    return ss.str();
}

std::string JSONLWriter::mutation_to_key(const Mutation& mut) {
    return "nt:" + mut.chromosome + ":" + std::to_string(mut.position) + ":" + 
           nuc_to_char(mut.par_nuc) + ":" + nuc_to_char(mut.mut_nuc);
}

std::string JSONLWriter::aa_mutation_to_key(const AAMutation& aa_mut) {
    return "aa:" + aa_mut.gene + ":" + std::to_string(aa_mut.codon_position) + ":" + 
           aa_mut.ref_aa + ":" + aa_mut.alt_aa;
}

} // namespace taxonium