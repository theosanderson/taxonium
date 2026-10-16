#include "taxonium/codon_table.hpp"

namespace taxonium {

// Static member definitions
std::unordered_map<std::string, char> CodonTable::codon_to_aa;
bool CodonTable::initialized = false;

} // namespace taxonium