# %%
#!wget https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.metadata.tsv.gz

# %%
#!wget https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.all.masked.pb

from alive_progress import config_handler, alive_it

config_handler.set_global(force_tty=True)

import ushertools
f = open("public-latest.all.masked.pb", "rb")
f2 = "./hu1.gb"
mat = ushertools.UsherMutationAnnotatedTree(f,f2)




# %%
mat.tree.write_tree_newick("/tmp/distance_tree.nwk")


# %%

print("Launching chronumental")
import os

os.system(
    "chronumental --tree /tmp/distance_tree.nwk --dates ./public-latest.metadata.tsv.gz --steps 140 --tree_out /tmp/timetree.nwk --dates_out ./date_comparison.tsv.gz"
)

# %%
import treeswift
print("Reading time tree")
time_tree = treeswift.read_tree("/tmp/timetree.nwk", schema="newick")
time_tree_iter = ushertools.preorder_traversal(time_tree.root)
for i, node in alive_it(enumerate(ushertools.preorder_traversal(mat.tree.root)),
                         title="Adding time tree"):
    time_tree_node = next(time_tree_iter)
    node.time_length = time_tree_node.edge_length
del time_tree
del time_tree_iter

# %%
from collections import defaultdict
import numpy as np
by_level = defaultdict(list)


def assign_x(tree, current_branch_length=0, current_level=0):

    by_level[current_level].append(tree)

    if tree.edge_length:
        current_branch_length = current_branch_length + tree.edge_length
    current_level += 1
    tree.x = current_branch_length
    for clade in tree.child_nodes():
        assign_x(clade, current_branch_length, current_level)


def assign_x_time(tree, current_branch_length=0):
    if tree.time_length:
        current_branch_length = current_branch_length + tree.time_length
    tree.x_time = current_branch_length
    for clade in tree.child_nodes():
        assign_x_time(clade, current_branch_length)


def assign_terminal_y(terminals):
    for i, node in enumerate(terminals):
        node.y = i


def align_parents(tree_by_level):
    for level in alive_it(sorted(list(by_level.keys()), reverse=True),
                           title="Align parents"):
        for node in by_level[level]:
            childrens_y = [item.y for item in node.child_nodes()]
            if len(childrens_y):
                node.y = (np.min(childrens_y) + np.max(childrens_y)) / 2



# %%
def rewrite(stuff):
    return f"{stuff[0]}:{stuff[2]}_{stuff[1]}_{stuff[3]}"
for node in mat.tree.traverse_preorder():
    node.aa_subs = [rewrite(x) for x in node.aa_muts]

# %%
import pandas as pd
import gzip, taxonium_pb2

def get_label_from_node(node):
    if node.label:
        return node.label
    else:
        return ""
root = mat.tree.root
assign_x(root)
assign_x_time(root)
terminals = list(mat.tree.traverse_leaves())
assign_terminal_y(terminals)
align_parents(by_level)

all_nodes = terminals
all_nodes.extend(list(mat.tree.traverse_internal()))
all_nodes.sort(key=lambda x: x.y)
lookup = {x: i for i, x in enumerate(all_nodes)}


def add_paths(by_level):
    for level in alive_it(sorted(list(by_level.keys())), title="Add paths"):
        for node in by_level[level]:
            this_node_id = lookup[node]
            for clade in node.child_nodes():
                clade.path_list = node.path_list + [
                    this_node_id,
                ]


root.path_list = []
add_paths(by_level)

metadata = pd.read_csv("public-latest.metadata.tsv.gz",
                       sep="\t",
                       usecols=[
                           'strain', 'genbank_accession', 'date', 'country',
                           'pangolin_lineage'
                       ])

metadata.set_index("strain", inplace=True)
metadata['country'] = metadata['country'].str.replace("_", " ")

print("B")


def make_mapping(list_of_strings):
    sorted_by_value_counts = [""] + pd.Series(list_of_strings).value_counts(
        sort=True).index.tolist()
    return sorted_by_value_counts, {
        x: i
        for i, x in enumerate(sorted_by_value_counts)
    }


all_lineages = metadata['pangolin_lineage'].unique().tolist()
lineage_mapping_list, lineage_mapping_lookup = make_mapping(all_lineages)

print("B1")
all_dates = metadata['date'].unique().tolist()
date_mapping_list, date_mapping_lookup = make_mapping(all_dates + ['nan'])
print("B2")

all_countries = metadata['country'].unique().tolist()
country_mapping_list, country_mapping_lookup = make_mapping(all_countries)

print("B3")




# %%
all_genotypes = set()
for x in alive_it(ushertools.preorder_traversal_iter(mat.tree.root)):
    for y in x.aa_subs:
        all_genotypes.add(y)


# %%

    
mutation_mapping_list, mutation_mapping_lookup = make_mapping(list(all_genotypes))

xes = []
yes = []
parents = []
names = []
dates = []
mutations = []
countries = []
lineages = []
genbanks = []
num_tips = []
epi_isls = []
time_xes = []

print("C")

# convert columns to string:
metadata['pangolin_lineage'] = metadata['pangolin_lineage'].astype(str)
metadata['date'] = metadata['date'].astype(str)
metadata['country'] = metadata['country'].astype(str)
metadata['genbank_accession'] = metadata['genbank_accession'].astype(str)

for i, x in alive_it(enumerate(all_nodes)):
    xes.append(x.x * 0.15)
    time_xes.append(x.x_time * 0.018)
    yes.append(x.y / 60000)
    path_list_rev = x.path_list[::-1]
    if len(path_list_rev) > 0:
        parents.append(path_list_rev[0])
    else:
        parents.append(i)

    name = get_label_from_node(x)

    if name:
        final_name = name.split("|")[0]

    else:
        final_name = ""
    names.append(final_name)

    try:
        genbank = metadata['genbank_accession'][name]
        if genbank == "nan":
            genbank = ""
    except KeyError:
        genbank = ""
    genbanks.append(genbank)
    try:
        the_date = metadata['date'][name]
    except KeyError:
        the_date = ""

    dates.append(date_mapping_lookup[the_date])

    try:
        the_country = metadata['country'][name]
        if the_country != the_country:
            the_country = ""
        if the_country == "nan":
            the_country = ""
    except KeyError:
        the_country = ""
    countries.append(country_mapping_lookup[the_country])
    try:
        the_lineage = metadata['pangolin_lineage'][name]
        # check if pd has returned nan
        if the_lineage != the_lineage:
            the_lineage = ""
        if the_lineage == "nan":
            the_lineage = ""
    except KeyError:
        the_lineage = ""
    lineages.append(lineage_mapping_lookup[the_lineage])
    mutations.append([mutation_mapping_lookup[y] for y in x.aa_subs])
    num_tips.append(len(list(x.traverse_leaves())))

    epi_isls.append(0)

my_color = taxonium_pb2.ColourMapping(key="Sweden", colour=[0, 0, 255])
my_color2 = taxonium_pb2.ColourMapping(key="Norway", colour=[0, 0, 150])

country_metadata_obj = taxonium_pb2.MetadataSingleValuePerNode(
    metadata_name="Country",
    mapping=country_mapping_list,
    node_values=countries)

lineage_metadata_obj = taxonium_pb2.MetadataSingleValuePerNode(
    metadata_name="Lineage",
    mapping=lineage_mapping_list,
    node_values=lineages)

all_node_data = taxonium_pb2.AllNodeData(
    genbanks=genbanks,
    names=names,
    x=xes,
    time_x=time_xes,
    y=yes,
    dates=dates,
    mutations=[taxonium_pb2.MutationList(mutation=x) for x in mutations],
    parents=parents,
    num_tips=num_tips,
    epi_isl_numbers=epi_isls,
    metadata_singles=[country_metadata_obj, lineage_metadata_obj])

all_data = taxonium_pb2.AllData(node_data=all_node_data,
                                mutation_mapping=mutation_mapping_list,
                                colour_mapping=[my_color, my_color2],
                                date_mapping=date_mapping_list)

f = gzip.open("./nodelist.pb.gz", "wb")
f.write(all_data.SerializeToString())
f.close()



