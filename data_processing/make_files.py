from Bio import Phylo
import numpy as np
import tqdm as tqdm
import random
import pandas as pd
import math
from collections import defaultdict
import tree_pb2
import gzip
import sys
sys.setrecursionlimit(15000)





tree = Phylo.read(open("./GISAID-hCoV-19-phylogeny-2021-07-05/global_lad.tree","rt"), "newick")
#tree.ladderize()
root=tree.clade
from collections import defaultdict
by_level = defaultdict(list)

the_names = {}

def assign_x(tree, current_branch_length=0, current_level=0):
    the_names[tree.name]=1
    by_level[current_level].append(tree)
    
    if tree.branch_length :
        current_branch_length = current_branch_length + tree.branch_length
    current_level+=1
    tree.x = current_branch_length
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

print("1")
assign_x(root)
print("2")
terminals = root.get_terminals()
print("3")
assign_terminal_y(terminals)
align_parents(by_level)
print("4")

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





    
print("B")





genotypes = defaultdict(list)





metadata = pd.read_csv("metadata.tsv",sep="\t")
lineage_lookup = defaultdict(lambda: "unknown")
date_lookup = defaultdict(lambda: "unknown")
country_lookup = defaultdict(lambda: "unknown")
genbank_lookup = defaultdict(lambda: "unknown")
for i,row in  tqdm.tqdm(metadata.iterrows()):
    

    name = row['Accession ID']#.split("|")[0]
    if name not in the_names:
        continue

    genbank_lookup[name] = str(row['Virus name'])
 
    lineage_lookup[name] = str(row['Pango lineage'])
    date_lookup[name] = str(row['Collection date'])
    row['country']=str(row['Location']).split("/")[1].strip()
    country_lookup[name]=row['country']
    genotypes[name]=str(row['AA Substitutions']).replace("(","").replace(")","").replace("_",":").split(",")
    #print(genotypes[name])


def make_mapping(list_of_strings):
    sorted_by_value_counts = ["unknown"]+pd.Series(list_of_strings).value_counts(sort=True).index.tolist()
    return sorted_by_value_counts, {x:i for i,x in enumerate(sorted_by_value_counts)}


all_lineages = [x for i,x in lineage_lookup.items()]
lineage_mapping_list, lineage_mapping_lookup = make_mapping(all_lineages)


all_dates = [x for i,x in date_lookup.items()]
date_mapping_list, date_mapping_lookup = make_mapping(all_dates)

all_countries = [x for i,x in country_lookup.items()]
country_mapping_list, country_mapping_lookup = make_mapping(all_countries)

all_genotypes = []
for i,x in genotypes.items():
    all_genotypes.extend(x)
mutation_mapping_list, mutation_mapping_lookup = make_mapping(all_genotypes)


xes = []
yes = []
parents = []
names = []
dates = []
mutations = []
countries = []
lineages = []
genbanks = []


print("C")
for i,x in tqdm.tqdm(enumerate(all_nodes)):
    xes.append(x.x*0.2)
    yes.append(x.y/4000)
    path_list_rev = x.path_list[::-1]
    if len(path_list_rev)>0:
        parents.append(path_list_rev[0])
    else:
        parents.append(i)
    if x.name:
        names.append(x.name.split("|")[0])
    else:
        names.append("")   
    genbanks.append(genbank_lookup[x.name])
    the_date = date_lookup[x.name]

    dates.append(date_mapping_lookup[the_date])

    the_country = country_lookup[x.name]
    countries.append(country_mapping_lookup[the_country])

    the_lineage = lineage_lookup[x.name]
    lineages.append(lineage_mapping_lookup[the_lineage])
    mutations.append([mutation_mapping_lookup[x] for x in genotypes[x.name]])


all_node_data = tree_pb2.AllNodeData(genbanks=genbanks,names=names,x=xes,y=yes, countries= countries, lineages=lineages,dates=dates, mutations=[tree_pb2.MutationList(mutation=x) for x in mutations],parents=parents )

all_data = tree_pb2.AllData(node_data=all_node_data, country_mapping=country_mapping_list,
lineage_mapping=lineage_mapping_list, mutation_mapping=mutation_mapping_list,
date_mapping=date_mapping_list)



f = open("../public/nodelist.pb", "wb")
f.write(all_data.SerializeToString())
f.close()

