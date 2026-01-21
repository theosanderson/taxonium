#include "taxonium/mutation.hpp"
#include <sstream>

namespace taxonium {

std::string Mutation::to_string() const {
    if (is_masked()) {
        return "MASKED";
    }
    
    std::stringstream ss;
    ss << nuc_to_char(par_nuc) << position << nuc_to_char(mut_nuc);
    return ss.str();
}

std::string AAMutation::to_string() const {
    std::stringstream ss;
    ss << gene << ":" << ref_aa << codon_position << alt_aa;
    return ss.str();
}

} // namespace taxonium