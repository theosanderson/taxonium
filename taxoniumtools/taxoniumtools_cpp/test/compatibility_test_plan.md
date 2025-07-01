# Taxoniumtools C++ Compatibility Testing Plan

## Goal
Ensure the C++ implementation produces byte-for-byte identical JSONL output compared to the Python version when processing the same input files.

## Test Strategy

### 1. Test Infrastructure Setup
- Create `test_compatibility/` directory for all test artifacts
- Add to `.gitignore`: `test_compatibility/`
- Structure:
  ```
  test_compatibility/
  ├── data/           # Downloaded test files
  ├── output_cpp/     # C++ version outputs
  ├── output_python/  # Python version outputs
  ├── logs/           # Execution logs and timing
  └── diffs/          # Difference files if any
  ```

### 2. Test Data Sets

#### Small Test (tfci)
- **Input**: `tfci.pb` (protobuf file)
- **Metadata**: `tfci.meta.tsv.gz` 
- **Reference**: `hu1.gb` (GenBank file)
- **Purpose**: Basic functionality test with all features

#### Medium Test (2021 COVID data)
- **Input**: Previously used 2021 dataset
- **Purpose**: Test with real-world data at moderate scale

#### Large Test (2022 COVID data)  
- **Input**: Previously used 2022 dataset
- **Purpose**: Performance and correctness at scale

### 3. Test Cases

#### Test Case 1: Basic Conversion (no metadata)
```bash
python -m taxoniumtools.usher_to_taxonium --input tfci.pb --output output_python/tfci_basic.jsonl
./taxoniumtools_cpp --input tfci.pb --output output_cpp/tfci_basic.jsonl
```

#### Test Case 2: With Metadata
```bash
python -m taxoniumtools.usher_to_taxonium --input tfci.pb --metadata tfci.meta.tsv.gz --output output_python/tfci_meta.jsonl
./taxoniumtools_cpp --input tfci.pb --metadata tfci.meta.tsv.gz --output output_cpp/tfci_meta.jsonl
```

#### Test Case 3: With GenBank Reference
```bash
python -m taxoniumtools.usher_to_taxonium --input tfci.pb --genbank hu1.gb --output output_python/tfci_genbank.jsonl
./taxoniumtools_cpp --input tfci.pb --genbank hu1.gb --output output_cpp/tfci_genbank.jsonl
```

#### Test Case 4: Full Features
```bash
python -m taxoniumtools.usher_to_taxonium --input tfci.pb --metadata tfci.meta.tsv.gz --genbank hu1.gb --columns sample_id,country,date --output output_python/tfci_full.jsonl
./taxoniumtools_cpp --input tfci.pb --metadata tfci.meta.tsv.gz --genbank hu1.gb --columns sample_id,country,date --output output_cpp/tfci_full.jsonl
```

### 4. Comparison Strategy

#### Line-by-Line JSON Comparison
Since JSONL files have one JSON object per line, we'll:
1. Parse each line as JSON
2. Compare JSON objects semantically (not string comparison)
3. Handle floating-point precision differences
4. Sort arrays if order doesn't matter
5. Report specific differences with context

#### Key Areas to Check
- **Node IDs**: Must match exactly
- **Mutations**: Position, reference, and alternate alleles
- **Metadata**: All fields present and values match
- **Tree structure**: Parent-child relationships
- **Coordinates**: X/Y positions (with tolerance for floats)
- **Branch lengths**: Edge weights

### 5. Automated Test Script

Create `run_compatibility_tests.py` that:
1. Downloads test data if not present
2. Runs both implementations with various options
3. Compares outputs using smart JSON comparison
4. Generates detailed report of any differences
5. Measures performance (time and memory)

### 6. Expected Challenges & Solutions

#### Floating Point Precision
- **Issue**: Different precision in C++ vs Python
- **Solution**: Compare with tolerance (e.g., 1e-6)

#### JSON Key Ordering
- **Issue**: Different libraries may order keys differently
- **Solution**: Parse and compare as objects, not strings

#### Missing Optional Fields
- **Issue**: One version might omit null/empty fields
- **Solution**: Normalize by adding missing fields as null

#### Internal Node Naming
- **Issue**: Different algorithms for generating internal node names
- **Solution**: May need to standardize or ignore in comparison

### 7. Success Criteria

The C++ implementation passes if:
1. All test cases produce semantically identical JSON output
2. Performance is significantly better than Python version
3. Memory usage is reasonable
4. No crashes or errors on any test input

### 8. Continuous Testing

- Add these tests to CI/CD pipeline
- Run on every commit
- Keep test data in separate repository or cache
- Monitor for regressions