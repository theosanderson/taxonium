// Minimal cxxopts-like implementation for command line parsing
#pragma once

#include <string>
#include <vector>
#include <unordered_map>
#include <sstream>
#include <iostream>
#include <iomanip>

namespace cxxopts {

class Options {
private:
    struct Option {
        std::string short_name;
        std::string long_name;
        std::string description;
        std::string default_value;
        bool has_value;
        bool required;
    };
    
    std::string program_name;
    std::string description;
    std::vector<Option> options;
    std::unordered_map<std::string, std::string> values;
    
public:
    Options(const std::string& prog, const std::string& desc = "") 
        : program_name(prog), description(desc) {}
    
    Options& add_options() { return *this; }
    
    Options& operator()(const std::string& spec, const std::string& desc, 
                        const std::string& default_val = "") {
        Option opt;
        opt.description = desc;
        opt.default_value = default_val;
        opt.has_value = true;
        opt.required = false;
        
        // Parse spec like "i,input"
        size_t comma = spec.find(',');
        if (comma != std::string::npos) {
            opt.short_name = spec.substr(0, comma);
            opt.long_name = spec.substr(comma + 1);
        } else {
            opt.long_name = spec;
        }
        
        options.push_back(opt);
        return *this;
    }
    
    void parse(int argc, char* argv[]) {
        // Check for help first
        for (int i = 1; i < argc; ++i) {
            if (std::string(argv[i]) == "--help" || std::string(argv[i]) == "-h") {
                values["help"] = "true";
                return;
            }
        }
        
        // Set defaults
        for (const auto& opt : options) {
            if (!opt.default_value.empty()) {
                values[opt.long_name] = opt.default_value;
            }
        }
        
        // Parse arguments
        for (int i = 1; i < argc; ++i) {
            std::string arg = argv[i];
            
            if (arg.substr(0, 2) == "--") {
                // Long option
                std::string name = arg.substr(2);
                size_t eq = name.find('=');
                std::string value;
                
                if (eq != std::string::npos) {
                    value = name.substr(eq + 1);
                    name = name.substr(0, eq);
                } else if (i + 1 < argc && argv[i + 1][0] != '-') {
                    value = argv[++i];
                }
                
                values[name] = value;
                
            } else if (arg.substr(0, 1) == "-" && arg.length() > 1) {
                // Short option
                std::string name = arg.substr(1);
                std::string value;
                
                if (i + 1 < argc && argv[i + 1][0] != '-') {
                    value = argv[++i];
                }
                
                // Find long name for this short option
                for (const auto& opt : options) {
                    if (opt.short_name == name) {
                        values[opt.long_name] = value;
                        break;
                    }
                }
            }
        }
    }
    
    bool count(const std::string& name) const {
        return values.find(name) != values.end() && !values.at(name).empty();
    }
    
    std::string operator[](const std::string& name) const {
        auto it = values.find(name);
        return (it != values.end()) ? it->second : "";
    }
    
    void show_help() const {
        std::cout << "Usage: " << program_name << " [options]\n";
        if (!description.empty()) {
            std::cout << description << "\n";
        }
        std::cout << "\nOptions:\n";
        
        for (const auto& opt : options) {
            std::cout << "  ";
            if (!opt.short_name.empty()) {
                std::cout << "-" << opt.short_name << ", ";
            }
            std::cout << "--" << std::setw(20) << std::left << opt.long_name;
            std::cout << opt.description;
            if (!opt.default_value.empty()) {
                std::cout << " (default: " << opt.default_value << ")";
            }
            std::cout << "\n";
        }
    }
};

} // namespace cxxopts