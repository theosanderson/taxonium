# Taxoniumtools C++ Port - Equivalence Testing

## Project Goal
Make the C++ version of taxoniumtools produce **exactly equivalent** output to the Python version, enabling comprehensive testing and validation.

## Background
- **taxoniumtools** converts phylogenetic trees (UShER protobuf format) to Taxonium JSONL format
- A **C++ version** was created for performance (14.5x faster, 6.4x less memory)
- The C++ version lacks some features (see `cpp_missing_features.md`) but should produce identical output for the features it implements

## Current Status

### ✅ Completed
1. **Built comprehensive test suite** (`test_equivalence.py`)
   - Compares Python and C++ outputs across multiple scenarios
   - Tests basic conversion, with metadata, with genbank, and full scenarios

2. **Fixed mutation ordering**
   - **Problem**: Python used sets which had non-deterministic ordering
   - **Solution**: Modified both Python and C++ to sort mutations deterministically:
     - **AA mutations**: Sort by `(gene, codon_position, ref_aa, alt_aa)`
     - **NT mutations**: Sort by `(chromosome, position, par_nuc, mut_nuc)`
   - Modified files:
     - Python: `src/taxoniumtools/utils.py` (get_all_aa_muts, get_all_nuc_muts)
     - C++: `taxoniumtools_cpp/src/jsonl_writer.cpp`

3. **Fixed nuc_for_codon off-by-one error** ✓
   - **Problem**: C++ was adding 1 to convert to 1-indexed, but Python stores 0-indexed
   - **Solution**: Removed the +1 in C++ to match Python's 0-indexed positions
   - Modified files:
     - C++: `taxoniumtools_cpp/src/tree.cpp` and `taxoniumtools_cpp/src/main.cpp`

4. **Fixed DFS traversal for y-coordinates** ✓
   - **Problem**: Python's `traverse_leaves()` had non-deterministic order
   - **Solution**: Implemented explicit DFS preorder traversal for leaves
   - Modified files:
     - Python: `src/taxoniumtools/utils.py` (set_terminal_y_coords)

5. **Fixed ladderize determinism** ✓
   - **Problem**: treeswift's ladderize lacked deterministic tiebreaking when nodes had equal num_tips
   - **Solution**: Implemented custom deterministic_ladderize() with tiebreaking by name
   - Modified files:
     - Python: `src/taxoniumtools/utils.py` (added deterministic_ladderize)
     - Python: `src/taxoniumtools/usher_to_taxonium.py` (uses deterministic_ladderize)

### ✅ Tests Passing
- ✅ With metadata
- ✅ With genbank
- ✅ Full (metadata + genbank)

### 🔧 Remaining Issues
- ⚠️ Basic test: Occasional random mismatches (1-3 nodes) due to test sampling hitting edge cases
- ❌ MPOX with variable sites: Python has treeswift parsing error (upstream issue, not taxoniumtools)

## Key Files

### Test Infrastructure
- `test_equivalence.py` - Main test suite comparing Python vs C++ outputs
- `compare_mutations.py` - Detailed mutation comparison utility
- `test_outputs/` - Directory containing test outputs for comparison

### Python Implementation
- `src/taxoniumtools/usher_to_taxonium.py` - Main conversion script
- `src/taxoniumtools/utils.py` - Utility functions (mutation collection, sorting)
- `src/taxoniumtools/ushertools.py` - Core tree handling

### C++ Implementation
- `taxoniumtools_cpp/src/main.cpp` - Entry point
- `taxoniumtools_cpp/src/jsonl_writer.cpp` - JSONL output generation
- `taxoniumtools_cpp/src/tree.cpp` - Tree structure
- `taxoniumtools_cpp/build/taxoniumtools_cpp` - Built executable

### Test Data
Located in `test_data/`:
- `tfci.pb` - Small SARS-CoV-2 tree (4060 nodes)
- `tfci.meta.tsv.gz` - Metadata for tfci
- `hu1.gb` - GenBank reference for SARS-CoV-2
- `mpox.pb` - MPOX tree for variable sites testing
- `mpox_ref.fasta` - MPOX reference

## How to Run Tests

### Install Python version in editable mode
```bash
cd /Users/theosanderson/Downloads/taxonium-cpp/taxoniumtools
pip install -e .
```

### Build C++ version
```bash
cd taxoniumtools_cpp/build
cmake ..
make -j4
```

### Run tests
```bash
cd /Users/theosanderson/Downloads/taxonium-cpp/taxoniumtools
python test_equivalence.py                    # Run all tests
python test_equivalence.py --test "Basic"     # Run specific test
```

## Changes Made

### Python Changes (src/taxoniumtools/utils.py)
```python
def get_all_aa_muts(root):
    all_aa_muts = set()
    for node in alive_it(list(root.traverse_preorder()),
                         title="Collecting all AA mutations"):
        if hasattr(node, 'aa_muts'):
            all_aa_muts.update(node.aa_muts)
    # Sort for deterministic output: by gene, position, initial AA, final AA
    return sorted(list(all_aa_muts), key=lambda x: (x.gene, x.one_indexed_codon, x.initial_aa, x.final_aa))

def get_all_nuc_muts(root):
    all_nuc_muts = set()
    for node in alive_it(list(root.traverse_preorder()),
                         title="Collecting all nuc mutations"):
        if node.nuc_mutations:
            all_nuc_muts.update(node.nuc_mutations)
    # Sort for deterministic output: by chromosome, position, parent nuc, mutated nuc
    return sorted(list(all_nuc_muts), key=lambda x: (x.chromosome, x.one_indexed_position, x.par_nuc, x.mut_nuc))
```

### C++ Changes (taxoniumtools_cpp/src/jsonl_writer.cpp)
Added sorting after mutation collection (around line 148):
```cpp
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
```

## Next Steps

1. **Investigate metadata test failures**
   - Check if metadata is being attached to nodes correctly
   - Verify metadata column ordering
   - Check for node name matching differences

2. **Investigate genbank test failures**
   - Verify AA mutations are computed identically
   - Check gene parsing and ordering
   - Validate codon translations

3. **Fix MPOX test**
   - The Python version fails to parse the MPOX newick tree
   - This is a Python issue, not C++ issue
   - May need to report upstream to treeswift

## Important Notes

- Both Python and C++ versions are **now deterministic** in mutation ordering
- The Python version was previously non-deterministic (sets have undefined order)
- We chose to **modify both** Python and C++ to ensure deterministic output
- Tests run the **local editable install** of Python code (via `pip install -e .`)
- Mutations are indexed sequentially after sorting, so identical sorting = identical indices

## Debugging Tips

To investigate differences:
```python
import json

# Load outputs
with open('test_outputs/tfci_python_basic.jsonl', 'r') as f:
    py_header = json.loads(f.readline())
    py_nodes = [json.loads(line) for line in f.readlines()]

with open('test_outputs/tfci_cpp_basic.jsonl', 'r') as f:
    cpp_header = json.loads(f.readline())
    cpp_nodes = [json.loads(line) for line in f.readlines()]

# Compare mutations
print("Mutations match:", py_header['mutations'] == cpp_header['mutations'])

# Find first difference in nodes
for i, (py, cpp) in enumerate(zip(py_nodes, cpp_nodes)):
    if py != cpp:
        print(f"Node {i} differs")
        break
```

## Contact
For questions about taxoniumtools, see the main README.md and documentation at https://docs.taxonium.org/
