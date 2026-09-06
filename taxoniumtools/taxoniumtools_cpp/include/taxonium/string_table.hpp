#ifndef TAXONIUM_STRING_TABLE_HPP
#define TAXONIUM_STRING_TABLE_HPP

#include <string>
#include <unordered_map>
#include <vector>
#include <memory>

namespace taxonium {

class StringTable {
public:
    using StringId = uint32_t;
    static constexpr StringId EMPTY_STRING_ID = 0;
    
    StringTable() {
        // Reserve index 0 for empty string
        strings_.push_back("");
        string_to_id_[""] = EMPTY_STRING_ID;
    }
    
    // Intern a string and return its ID
    StringId intern(const std::string& str) {
        if (str.empty()) {
            return EMPTY_STRING_ID;
        }
        
        auto it = string_to_id_.find(str);
        if (it != string_to_id_.end()) {
            return it->second;
        }
        
        StringId id = strings_.size();
        strings_.push_back(str);
        string_to_id_[str] = id;
        return id;
    }
    
    // Get string by ID
    const std::string& get(StringId id) const {
        if (id >= strings_.size()) {
            return strings_[EMPTY_STRING_ID];  // Return empty string for invalid ID
        }
        return strings_[id];
    }
    
    // Get statistics
    size_t size() const { return strings_.size(); }
    size_t unique_count() const { return strings_.size() - 1; }  // Exclude empty string
    
    // Calculate memory usage
    size_t memory_usage() const {
        size_t total = sizeof(StringTable);
        
        // String storage
        for (const auto& str : strings_) {
            total += str.capacity() + sizeof(std::string);
        }
        
        // Hash map overhead
        total += string_to_id_.bucket_count() * sizeof(void*);
        total += string_to_id_.size() * (sizeof(std::string) + sizeof(StringId) + sizeof(void*));
        
        return total;
    }
    
private:
    std::vector<std::string> strings_;
    std::unordered_map<std::string, StringId> string_to_id_;
};

// Global string table singleton
class GlobalStringTable {
public:
    static StringTable& get() {
        static StringTable instance;
        return instance;
    }
    
private:
    GlobalStringTable() = default;
};

} // namespace taxonium

#endif // TAXONIUM_STRING_TABLE_HPP