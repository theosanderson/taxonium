#pragma once

#include <string>
#include <vector>
#include <sstream>
#include <iomanip>

namespace taxonium {

// String utilities
std::vector<std::string> split_string(const std::string& str, char delimiter);
std::string join_strings(const std::vector<std::string>& strings, const std::string& delimiter);
bool ends_with(const std::string& str, const std::string& suffix);
std::string trim(const std::string& str);

// Template function for number to string conversion
template<typename T>
std::string to_string_with_precision(T value, int precision = 6) {
    std::stringstream ss;
    ss << std::fixed << std::setprecision(precision) << value;
    return ss.str();
}

} // namespace taxonium