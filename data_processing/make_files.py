from Bio import Phylo
import numpy as np
import tqdm as tqdm
import random
import pandas as pd
import math
from collections import defaultdict
import tree_pb2

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

all_nodes_to_export = [{'num':i,'name':x.name,'x':5000*x.x,'y':x.y/20000,'path':x.path_list[::-1]} for i,x in tqdm.tqdm(enumerate(all_nodes))]
def make_node(x):
    parents = x.path_list[::-1]
    if len(parents)>0:
        return tree_pb2.Node(name=x.name,x=5000*x.x,y=x.y/20000,parent=parents[0])
    else:
        return tree_pb2.Node(name=x.name,x=5000*x.x,y=x.y/20000)

pb_list = [make_node(x) for i,x in tqdm.tqdm(enumerate(all_nodes))]
node_list = tree_pb2.NodeList(nodes=pb_list)
node_list.SerializeToString()

f = open("../public/nodelist.pb", "wb")
f.write(node_list.SerializeToString())
f.close()

metadata = [{'name':x.name,'lineage':lineage_lookup[x.name],'date':date_lookup[x.name]} for i,x in tqdm.tqdm(enumerate(all_nodes))]

def shard_array(inlist, shard_size):
    # inlist = 150-element list
    # shard_size = 40
    num_shards = math.ceil(len(inlist) / shard_size)
    # num_shards == 3

    shards = []
    for i in range(num_shards):
        # i == 0
        start = shard_size * i  # start == 0, then 40, then 80...
        end = shard_size * (i + 1)   # end == 39, then 79, then 119...
        shards.append(inlist[start:end])

    return shards

shard_size = 200000
sharded = shard_array(all_nodes_to_export,shard_size)

import json

with open('../public/data/config.json', 'w') as f:
    json.dump({"num_tree_shards":len(sharded),"shard_size":shard_size,"num_elements":len(all_nodes_to_export)},f)

for i, shard in enumerate(sharded):
    with open(f'../public/data/tree_shards/{i}.json', 'w') as f:
        json.dump(sharded[i],f, separators=(',', ':'))

with open(f'../public/data/metadata.json', 'w') as f:
        json.dump(metadata,f, separators=(',', ':'))
