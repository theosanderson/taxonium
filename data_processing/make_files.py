from Bio import Phylo
import numpy as np
import tqdm as tqdm
import random
import pandas as pd
from collections import defaultdict


metadata = pd.read_csv('./cog_metadata.csv')
lineage_lookup = defaultdict(lambda: "unknown")
date_lookup = defaultdict(lambda: "unknown")
for i,row in metadata.iterrows():
    lineage_lookup[row['sequence_name']] = row['lineage']
    date_lookup[row['sequence_name']] = row['sample_date']
    

tree = Phylo.read("./cog_global_tree.newick", "newick")
tree.ladderize()
root=tree.clade
from collections import defaultdict
by_level = defaultdict(list)


def assign_x(tree, current_branch_length=0, current_level=0):
    
    by_level[current_level].append(tree)
    tree.x = current_branch_length
    if tree.branch_length :
        current_branch_length = current_branch_length + tree.branch_length
    current_level+=1
    
    for clade in tree.clades:
        assign_x(clade,current_branch_length,current_level)


def assign_terminal_y(terminals):
    for i,node in enumerate(terminals):
        node.y=i
    

def align_parents(tree_by_level):
    for level in tqdm.tqdm(sorted( list(by_level.keys()), reverse=True)):
        for node in by_level[level]:
            childrens_y = [item.y for item in node.clades]
            if len(childrens_y):
                node.y=np.mean(childrens_y)

assign_x(root)
terminals = root.get_terminals()
assign_terminal_y(terminals)
align_parents(by_level)

all_nodes= terminals
all_nodes.extend(root.get_nonterminals())
all_nodes.sort(key=lambda x: x.y)
lookup = {x:i for i,x in enumerate(all_nodes)}

def add_paths(tree_by_level):
    for level in tqdm.tqdm(sorted( list(by_level.keys()))):
        for node in by_level[level]:
            this_node_id = lookup[node]
            for clade in node.clades:
                clade.path_list = node.path_list + [this_node_id,]
root.path_list = []
add_paths(by_level)

all_nodes_to_export = [{'name':x.name,'x':5000*x.x,'y':x.y/20000,'lineage':lineage_lookup[x.name],'date':date_lookup[x.name],'path':x.path_list[::-1]} for x in tqdm.tqdm(all_nodes)]

import json
shard_size = 100
with open('../src/data2.json', 'w') as f:
    json.dump(all_nodes_to_export,f, separators=(',', ':'))