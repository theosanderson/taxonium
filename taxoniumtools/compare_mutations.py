#!/usr/bin/env python3
import json
import random
import sys

def load_jsonl(filename):
    """Load JSONL file and return header and nodes"""
    with open(filename, 'r') as f:
        lines = f.readlines()
    header = json.loads(lines[0])
    nodes = [json.loads(line) for line in lines[1:]]
    return header, nodes

def compare_mutations(python_file, cpp_file, num_samples=10):
    """Compare mutations between Python and C++ outputs"""
    
    # Load both files
    print("Loading Python output...")
    py_header, py_nodes = load_jsonl(python_file)
    print(f"Loaded {len(py_nodes)} nodes from Python output")
    
    print("\nLoading C++ output...")
    cpp_header, cpp_nodes = load_jsonl(cpp_file)
    print(f"Loaded {len(cpp_nodes)} nodes from C++ output")
    
    # Create mutation lookup tables
    print("\nBuilding mutation lookup tables...")
    py_mutations = {i: mut for i, mut in enumerate(py_header['mutations'])}
    cpp_mutations = {i: mut for i, mut in enumerate(cpp_header['mutations'])}
    
    print(f"Python has {len(py_mutations)} mutations")
    print(f"C++ has {len(cpp_mutations)} mutations")
    
    # Find nodes with mutations
    nodes_with_mutations = []
    for i, (py_node, cpp_node) in enumerate(zip(py_nodes, cpp_nodes)):
        if len(py_node.get('mutations', [])) > 0:
            nodes_with_mutations.append(i)
    
    print(f"\nFound {len(nodes_with_mutations)} nodes with mutations")
    
    # Sample random nodes
    if len(nodes_with_mutations) > num_samples:
        sample_indices = random.sample(nodes_with_mutations, num_samples)
    else:
        sample_indices = nodes_with_mutations[:num_samples]
    
    print(f"\nComparing {len(sample_indices)} random nodes with mutations:")
    print("=" * 80)
    
    all_match = True
    
    for node_idx in sample_indices:
        py_node = py_nodes[node_idx]
        cpp_node = cpp_nodes[node_idx]
        
        print(f"\nNode {node_idx}: {py_node['name']}")
        
        # Check if names match
        if py_node['name'] != cpp_node['name']:
            print(f"  ERROR: Names don't match! Python: {py_node['name']}, C++: {cpp_node['name']}")
            all_match = False
            continue
            
        # Get mutation indices
        py_mut_indices = py_node.get('mutations', [])
        cpp_mut_indices = cpp_node.get('mutations', [])
        
        print(f"  Python mutation indices: {py_mut_indices}")
        print(f"  C++ mutation indices: {cpp_mut_indices}")
        
        # Resolve mutations
        py_resolved = []
        cpp_resolved = []
        
        for idx in py_mut_indices:
            if idx in py_mutations:
                mut = py_mutations[idx]
                py_resolved.append(f"{mut['gene']}:{mut['previous_residue']}{mut['residue_pos']}{mut['new_residue']}")
            else:
                py_resolved.append(f"INVALID_INDEX_{idx}")
                
        for idx in cpp_mut_indices:
            if idx in cpp_mutations:
                mut = cpp_mutations[idx]
                cpp_resolved.append(f"{mut['gene']}:{mut['previous_residue']}{mut['residue_pos']}{mut['new_residue']}")
            else:
                cpp_resolved.append(f"INVALID_INDEX_{idx}")
        
        print(f"  Python mutations: {py_resolved}")
        print(f"  C++ mutations: {cpp_resolved}")
        
        # Check if resolved mutations match (order doesn't matter)
        py_set = set(py_resolved)
        cpp_set = set(cpp_resolved)
        
        if py_set == cpp_set:
            print("  ✓ Mutations match!")
        else:
            print("  ✗ Mutations don't match!")
            print(f"    Only in Python: {py_set - cpp_set}")
            print(f"    Only in C++: {cpp_set - py_set}")
            all_match = False
    
    print("\n" + "=" * 80)
    if all_match:
        print("✓ All sampled nodes have matching mutations!")
    else:
        print("✗ Some nodes have mismatched mutations!")
    
    # Also check some statistics
    print("\nAdditional checks:")
    print(f"  Total nodes match: {len(py_nodes) == len(cpp_nodes)}")
    print(f"  Total mutations match: {len(py_mutations) == len(cpp_mutations)}")
    
    # Sample first few mutations to see the pattern
    print("\nFirst 5 mutations in each file:")
    print("Python:")
    for i in range(5):
        mut = py_mutations[i]
        print(f"  {i}: {mut['gene']}:{mut['previous_residue']}{mut['residue_pos']}{mut['new_residue']}")
    print("C++:")
    for i in range(5):
        mut = cpp_mutations[i]
        print(f"  {i}: {mut['gene']}:{mut['previous_residue']}{mut['residue_pos']}{mut['new_residue']}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python compare_mutations.py <python_output.jsonl> <cpp_output.jsonl>")
        sys.exit(1)
    
    compare_mutations(sys.argv[1], sys.argv[2], num_samples=20)