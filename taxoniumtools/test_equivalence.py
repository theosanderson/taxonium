#!/usr/bin/env python3
"""
Test suite to compare Python and C++ taxoniumtools outputs for equivalence
"""

import json
import subprocess
import sys
from pathlib import Path
import argparse
import gzip
from typing import Dict, List, Tuple, Any


class Colors:
    RED = '\033[0;31m'
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    BLUE = '\033[0;34m'
    NC = '\033[0m'  # No Color


def load_jsonl(filepath: Path) -> Tuple[Dict, List[Dict]]:
    """Load JSONL file and return header and nodes"""
    open_fn = gzip.open if filepath.suffix == '.gz' else open

    with open_fn(filepath, 'rt') as f:
        lines = f.readlines()

    header = json.loads(lines[0])
    nodes = [json.loads(line) for line in lines[1:]]
    return header, nodes


def compare_headers(py_header: Dict, cpp_header: Dict) -> bool:
    """Compare headers from both outputs"""
    print("  Comparing headers...")

    all_match = True

    # Check number of mutations
    py_mut_count = len(py_header.get('mutations', []))
    cpp_mut_count = len(cpp_header.get('mutations', []))

    if py_mut_count == cpp_mut_count:
        print(f"    {Colors.GREEN}✓{Colors.NC} Mutation count matches: {py_mut_count}")
    else:
        print(f"    {Colors.RED}✗{Colors.NC} Mutation count mismatch: Python={py_mut_count}, C++={cpp_mut_count}")
        all_match = False

    # Check mutations list
    if py_mut_count == cpp_mut_count and py_mut_count > 0:
        mismatches = []
        for i in range(min(10, py_mut_count)):  # Check first 10
            py_mut = py_header['mutations'][i]
            cpp_mut = cpp_header['mutations'][i]
            if py_mut != cpp_mut:
                mismatches.append((i, py_mut, cpp_mut))

        if mismatches:
            print(f"    {Colors.RED}✗{Colors.NC} First few mutations differ:")
            for i, py_mut, cpp_mut in mismatches[:3]:
                print(f"      [{i}] Python: {py_mut}")
                print(f"      [{i}] C++:    {cpp_mut}")
            all_match = False
        else:
            print(f"    {Colors.GREEN}✓{Colors.NC} First 10 mutations match")

    # Check other header fields
    for key in ['reference', 'title', 'name']:
        if key in py_header or key in cpp_header:
            if py_header.get(key) == cpp_header.get(key):
                print(f"    {Colors.GREEN}✓{Colors.NC} {key} matches")
            else:
                print(f"    {Colors.RED}✗{Colors.NC} {key} mismatch: Python={py_header.get(key)}, C++={cpp_header.get(key)}")
                all_match = False

    return all_match


def compare_nodes(py_nodes: List[Dict], cpp_nodes: List[Dict], num_samples: int = 20) -> bool:
    """Compare nodes from both outputs"""
    print(f"  Comparing nodes...")

    if len(py_nodes) != len(cpp_nodes):
        print(f"    {Colors.RED}✗{Colors.NC} Node count mismatch: Python={len(py_nodes)}, C++={len(cpp_nodes)}")
        return False

    print(f"    {Colors.GREEN}✓{Colors.NC} Node count matches: {len(py_nodes)}")

    all_match = True

    # Find nodes with mutations
    nodes_with_mutations = [i for i, node in enumerate(py_nodes) if node.get('mutations')]
    print(f"    Found {len(nodes_with_mutations)} nodes with mutations")

    # Sample some nodes
    import random
    if len(nodes_with_mutations) > num_samples:
        sample_indices = random.sample(nodes_with_mutations, num_samples)
    else:
        sample_indices = nodes_with_mutations[:num_samples]

    mismatches = []
    for idx in sample_indices:
        py_node = py_nodes[idx]
        cpp_node = cpp_nodes[idx]

        # Check names
        if py_node.get('name') != cpp_node.get('name'):
            mismatches.append(f"Node {idx}: name mismatch")
            continue

        # Check mutations
        py_muts = set(py_node.get('mutations', []))
        cpp_muts = set(cpp_node.get('mutations', []))

        if py_muts != cpp_muts:
            mismatches.append(f"Node {idx} ({py_node.get('name')}): mutations differ")
            all_match = False

        # Check metadata
        py_meta = py_node.get('meta', {})
        cpp_meta = cpp_node.get('meta', {})

        if set(py_meta.keys()) != set(cpp_meta.keys()):
            mismatches.append(f"Node {idx}: metadata keys differ")
            all_match = False

    if mismatches:
        print(f"    {Colors.RED}✗{Colors.NC} Found {len(mismatches)} mismatches in sampled nodes:")
        for mm in mismatches[:5]:
            print(f"      - {mm}")
        if len(mismatches) > 5:
            print(f"      ... and {len(mismatches) - 5} more")
    else:
        print(f"    {Colors.GREEN}✓{Colors.NC} All sampled nodes match")

    return all_match


def run_test(test_name: str, py_args: List[str], cpp_args: List[str],
             py_output: Path, cpp_output: Path) -> bool:
    """Run a single test comparing Python and C++ outputs"""

    print(f"\n{Colors.BLUE}Test: {test_name}{Colors.NC}")
    print("=" * 60)

    # Run Python version
    print(f"  Running Python version...")
    py_cmd = ['usher_to_taxonium'] + py_args + ['-o', str(py_output)]
    try:
        subprocess.run(py_cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"    {Colors.RED}✗{Colors.NC} Python version failed:")
        print(f"      {e.stderr}")
        return False

    # Run C++ version
    print(f"  Running C++ version...")
    cpp_bin = Path('taxoniumtools_cpp/build/taxoniumtools_cpp').absolute()
    cpp_cmd = [str(cpp_bin)] + cpp_args + ['-o', str(cpp_output)]
    try:
        subprocess.run(cpp_cmd, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as e:
        print(f"    {Colors.RED}✗{Colors.NC} C++ version failed:")
        print(f"      {e.stderr}")
        return False

    # Load and compare outputs
    print(f"  Loading outputs...")
    py_header, py_nodes = load_jsonl(py_output)
    cpp_header, cpp_nodes = load_jsonl(cpp_output)

    # Compare
    header_match = compare_headers(py_header, cpp_header)
    nodes_match = compare_nodes(py_nodes, cpp_nodes)

    if header_match and nodes_match:
        print(f"\n  {Colors.GREEN}✓ TEST PASSED{Colors.NC}")
        return True
    else:
        print(f"\n  {Colors.RED}✗ TEST FAILED{Colors.NC}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Test equivalence between Python and C++ taxoniumtools')
    parser.add_argument('--test-data', type=Path, default=Path('test_data'),
                       help='Path to test data directory')
    parser.add_argument('--output-dir', type=Path, default=Path('test_outputs'),
                       help='Path to output directory')
    parser.add_argument('--test', type=str, help='Run specific test only')

    args = parser.parse_args()

    # Setup
    args.output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("Taxonium Tools Equivalence Test Suite")
    print("=" * 60)

    # Check if C++ binary exists
    cpp_bin = Path('taxoniumtools_cpp/build/taxoniumtools_cpp')
    if not cpp_bin.exists():
        cpp_bin = Path('./taxoniumtools_cpp')
        if not cpp_bin.exists():
            print(f"{Colors.RED}ERROR: C++ binary not found{Colors.NC}")
            return 1

    cpp_bin = cpp_bin.absolute()

    # Define tests
    tests = []

    # Test 1: Basic conversion
    if (args.test_data / 'tfci.pb').exists():
        tests.append({
            'name': 'Basic conversion (no metadata, no genbank)',
            'py_args': ['-i', str(args.test_data / 'tfci.pb')],
            'cpp_args': ['-i', str(args.test_data / 'tfci.pb')],
            'py_output': args.output_dir / 'tfci_python_basic.jsonl',
            'cpp_output': args.output_dir / 'tfci_cpp_basic.jsonl',
        })

    # Test 2: With metadata
    if (args.test_data / 'tfci.pb').exists() and (args.test_data / 'tfci.meta.tsv.gz').exists():
        tests.append({
            'name': 'With metadata',
            'py_args': ['-i', str(args.test_data / 'tfci.pb'),
                       '-m', str(args.test_data / 'tfci.meta.tsv.gz'),
                       '-c', 'country,date'],
            'cpp_args': ['-i', str(args.test_data / 'tfci.pb'),
                        '-m', str(args.test_data / 'tfci.meta.tsv.gz'),
                        '-c', 'country,date'],
            'py_output': args.output_dir / 'tfci_python_meta.jsonl',
            'cpp_output': args.output_dir / 'tfci_cpp_meta.jsonl',
        })

    # Test 3: With genbank
    if (args.test_data / 'tfci.pb').exists() and (args.test_data / 'hu1.gb').exists():
        tests.append({
            'name': 'With genbank',
            'py_args': ['-i', str(args.test_data / 'tfci.pb'),
                       '-g', str(args.test_data / 'hu1.gb')],
            'cpp_args': ['-i', str(args.test_data / 'tfci.pb'),
                        '-g', str(args.test_data / 'hu1.gb')],
            'py_output': args.output_dir / 'tfci_python_gb.jsonl',
            'cpp_output': args.output_dir / 'tfci_cpp_gb.jsonl',
        })

    # Test 4: Full (metadata + genbank)
    if all((args.test_data / f).exists() for f in ['tfci.pb', 'tfci.meta.tsv.gz', 'hu1.gb']):
        tests.append({
            'name': 'Full (metadata + genbank)',
            'py_args': ['-i', str(args.test_data / 'tfci.pb'),
                       '-m', str(args.test_data / 'tfci.meta.tsv.gz'),
                       '-g', str(args.test_data / 'hu1.gb'),
                       '-c', 'country,date'],
            'cpp_args': ['-i', str(args.test_data / 'tfci.pb'),
                        '-m', str(args.test_data / 'tfci.meta.tsv.gz'),
                        '-g', str(args.test_data / 'hu1.gb'),
                        '-c', 'country,date'],
            'py_output': args.output_dir / 'tfci_python_full.jsonl',
            'cpp_output': args.output_dir / 'tfci_cpp_full.jsonl',
        })

    # Test 5: MPOX with variable sites
    if (args.test_data / 'mpox.pb').exists():
        mpox_test = {
            'name': 'MPOX with variable sites only',
            'py_args': ['-i', str(args.test_data / 'mpox.pb'),
                       '--only_variable_sites'],
            'cpp_args': ['-i', str(args.test_data / 'mpox.pb'),
                        '--only-variable-sites'],
            'py_output': args.output_dir / 'mpox_python.jsonl',
            'cpp_output': args.output_dir / 'mpox_cpp.jsonl',
        }
        if (args.test_data / 'mpox_ref.fasta').exists():
            mpox_test['py_args'].extend(['-g', str(args.test_data / 'mpox_ref.fasta')])
            mpox_test['cpp_args'].extend(['-g', str(args.test_data / 'mpox_ref.fasta')])
        tests.append(mpox_test)

    if not tests:
        print(f"{Colors.YELLOW}No test data files found in {args.test_data}{Colors.NC}")
        return 1

    # Run tests
    results = []
    for test in tests:
        if args.test and args.test not in test['name']:
            continue
        result = run_test(test['name'], test['py_args'], test['cpp_args'],
                         test['py_output'], test['cpp_output'])
        results.append((test['name'], result))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)

    for name, result in results:
        status = f"{Colors.GREEN}PASS{Colors.NC}" if result else f"{Colors.RED}FAIL{Colors.NC}"
        print(f"  {status} - {name}")

    passed = sum(1 for _, r in results if r)
    total = len(results)

    print(f"\n{passed}/{total} tests passed")

    return 0 if passed == total else 1


if __name__ == '__main__':
    sys.exit(main())
