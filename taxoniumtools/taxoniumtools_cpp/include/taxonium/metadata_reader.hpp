#pragma once

#include "tree.hpp"
#include <string>
#include <unordered_map>
#include <vector>
#include <functional>

namespace taxonium {

class MetadataReader {
private:
    std::unordered_map<std::string, std::unordered_map<std::string, std::string>> metadata;
    std::vector<std::string> column_names;
    
public:
    MetadataReader() = default;
    
    // Load metadata from TSV file
    void load(const std::string& filename, 
              const std::string& columns = "",
              const std::string& key_column = "strain");
    
    // Apply metadata to tree nodes
    void apply_to_tree(Tree* tree, std::function<void(size_t)> progress_callback = nullptr);
    
    // Get metadata for a specific sample
    const std::unordered_map<std::string, std::string>* get_metadata(const std::string& sample) const {
        auto it = metadata.find(sample);
        return (it != metadata.end()) ? &it->second : nullptr;
    }
    
    // Get column names
    const std::vector<std::string>& get_column_names() const { return column_names; }
};

} // namespace taxonium