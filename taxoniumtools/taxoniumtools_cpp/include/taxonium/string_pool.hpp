#ifndef TAXONIUM_STRING_POOL_HPP
#define TAXONIUM_STRING_POOL_HPP

#include <string>
#include <unordered_set>
#include <string_view>

namespace taxonium {

// Simple string pool using string interning
class StringPool {
public:
    const std::string& intern(const std::string& str) {
        auto result = pool_.insert(str);
        return *result.first;
    }
    
    const std::string& intern(std::string&& str) {
        auto result = pool_.insert(std::move(str));
        return *result.first;
    }
    
    size_t size() const { return pool_.size(); }
    
    void clear() { pool_.clear(); }

private:
    std::unordered_set<std::string> pool_;
};

// Global string pool for metadata values
inline StringPool& get_metadata_pool() {
    static StringPool pool;
    return pool;
}

} // namespace taxonium

#endif // TAXONIUM_STRING_POOL_HPP