#!/usr/bin/env python

# THIS SCRIPT NEEDS REFACTORING, IT'S GOT BODGED TOGETHER AND ONLY PARTIALLY CONVERTED TO DENDROPY
# SO DOESN'T MAKE BEST USE OF ITS FEATURES

from collections import defaultdict
import numpy as np
import pandas as pd
import taxonium_pb2
import parsimony_pb2
import tqdm
import gzip



import treeswift


def preorder_traversal(node):
    yield node
    for clade in node.children:
        yield from preorder_traversal(clade)


def preorder_traversal_iter(node):
    return iter(preorder_traversal(node))


"""accessions = pd.read_table("epiToPublic.tsv.gz",
                           names=["epi_isl", "genbank", "alternative", "date"],
                           low_memory=False)"""

epi_isl_lookup = defaultdict(lambda: 0)
"""for i, row in tqdm.tqdm(accessions.iterrows()):
    epi_int = int(row['epi_isl'].replace("EPI_ISL_", ""))
    epi_isl_lookup[row['genbank']] = epi_int"""


def get_epi_isl(genbank, alternative, date):
    if (genbank and epi_isl_lookup[genbank]):
        return epi_isl_lookup[genbank]
    else:
        return epi_isl_lookup[alternative]


import parsimony_pb2
import cov2_genome
import math

# In[3]:

NUC_ENUM = "ACGT"

seq = cov2_genome.seq.upper()


def get_codon_table():
    bases = "TCAG"
    codons = [a + b + c for a in bases for b in bases for c in bases]
    amino_acids = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
    codon_table = dict(zip(codons, amino_acids))
    return codon_table


codon_table = get_codon_table()

# In[12]:


def get_aa_ref(pos):

    for gene_name, gene_range in cov2_genome.genes.items():
        if pos >= gene_range[0] and pos <= gene_range[1]:
            aa_loc = math.floor((pos - gene_range[0]) / 3) + 1
            frame = (int(pos - gene_range[0])) % 3

            original_codon = seq[pos - 1 - frame:pos - 1 + 3 - frame]
            return f"{gene_name}:X_{aa_loc}_{codon_table[original_codon]}"
    return None


def get_aa_sub(pos, par, alt):

    for gene_name, gene_range in cov2_genome.genes.items():
        if pos >= gene_range[0] and pos <= gene_range[1]:
            aa_loc = math.floor((pos - gene_range[0]) / 3) + 1
            frame = (int(pos - gene_range[0])) % 3

            original_codon = seq[pos - 1 - frame:pos - 1 + 3 - frame]
            original_codon = list(original_codon)
            original_codon[frame] = par
            original_codon = "".join(original_codon)
            new_codon = list(original_codon)
            new_codon[frame] = alt
            new_codon = "".join(new_codon)

            if codon_table[original_codon] != codon_table[new_codon]:
                return f"{gene_name}:{codon_table[original_codon]}_{aa_loc}_{codon_table[new_codon]}"
    return None


# In[18]:

import tqdm
from io import StringIO

import treeswift


class UsherMutationAnnotatedTree:
    def __init__(self, tree_file):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)
        self.tree = treeswift.read_tree(self.data.newick, schema="newick")
        self.data.newick = ''

        self.annotate_mutations()
        self.set_branch_lengths()
        self.annotate_aa_mutations()
        self.expand_condensed_nodes()

    def annotate_mutations(self):
        for i, node in enumerate(preorder_traversal(self.tree.root)):
            node.nuc_mutations = self.data.node_mutations[i]

    def set_branch_lengths(self):
        for i, node in enumerate(preorder_traversal(self.tree.root)):
            node.edge_length = len(node.nuc_mutations.mutation)

    def annotate_aa_mutations(self):
        for i, node in tqdm.tqdm(enumerate(preorder_traversal(self.tree.root)),
                                 desc="Annotating mutations"):
            node.aa_subs = []
            for mut in node.nuc_mutations.mutation:
                ref = NUC_ENUM[mut.ref_nuc]
                alt = NUC_ENUM[mut.mut_nuc[0]]
                par = NUC_ENUM[mut.par_nuc]
                aa_sub = get_aa_sub(mut.position, par, alt)

                if aa_sub:
                    node.aa_subs.append(aa_sub)

    def expand_condensed_nodes(self):
        for i, node in tqdm.tqdm(enumerate(self.tree.traverse_leaves()),
                                 desc="Expanding condensed nodes"):

            if node.label and node.label in self.condensed_nodes_dict:

                for new_node_label in self.condensed_nodes_dict[node.label]:
                    new_node = treeswift.Node(label=new_node_label)
                    new_node.nuc_mutations = []
                    new_node.aa_subs = []
                    node.add_child(new_node)
                node.label = ""
            else:
                pass

    def get_condensed_nodes_dict(self, condensed_nodes_dict):
        output_dict = {}
        for condensed_node in tqdm.tqdm(condensed_nodes_dict,
                                        desc="Reading condensed nodes dict"):
            output_dict[
                condensed_node.node_name] = condensed_node.condensed_leaves
        return output_dict


# In[19]:

f = gzip.open("./public-latest.all.masked.pb.gz", "rb")

mat = UsherMutationAnnotatedTree(f)
mat.tree.ladderize(ascending=False)

all_ref_muts = set(get_aa_ref(x) for x in range(len(cov2_genome.seq)))
all_ref_muts = [x for x in all_ref_muts if x is not None]
mat.tree.root.aa_subs = all_ref_muts

# In[14]:


def get_label_from_node(node):
    if node.label:
        return node.label
    else:
        return ""


# In[16]:

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
    for level in tqdm.tqdm(sorted(list(by_level.keys()), reverse=True),
                           desc="Align parents"):
        for node in by_level[level]:
            childrens_y = [item.y for item in node.child_nodes()]
            if len(childrens_y):
                node.y = (np.min(childrens_y) + np.max(childrens_y)) / 2


mat.tree.write_tree_newick("/tmp/distance_tree.nwk")

print("Launching chronumental")
import os

os.system(
    "chronumental --tree /tmp/distance_tree.nwk --dates ./public-latest.metadata.tsv.gz --steps 1400 --tree_out /tmp/timetree.nwk"
)

print("Reading time tree")
time_tree = treeswift.read_tree("/tmp/timetree.nwk", schema="newick")
time_tree_iter = preorder_traversal(time_tree.root)
for i, node in tqdm.tqdm(enumerate(preorder_traversal(mat.tree.root)),
                         desc="Adding time tree"):
    time_tree_node = next(time_tree_iter)
    node.time_length = time_tree_node.edge_length
del time_tree
del time_tree_iter

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
    for level in tqdm.tqdm(sorted(list(by_level.keys())), desc="Add paths"):
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

all_dates = metadata['date'].unique().tolist()
date_mapping_list, date_mapping_lookup = make_mapping(all_dates)

all_countries = metadata['country'].unique().tolist()
country_mapping_list, country_mapping_lookup = make_mapping(all_countries)

all_genotypes = []
for x in preorder_traversal_iter(mat.tree.root):
    all_genotypes.extend(x.aa_subs)
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
num_tips = []
epi_isls = []
time_xes = []

print("C")

# convert columns to string:
metadata['pangolin_lineage'] = metadata['pangolin_lineage'].astype(str)
metadata['date'] = metadata['date'].astype(str)
metadata['country'] = metadata['country'].astype(str)
metadata['genbank_accession'] = metadata['genbank_accession'].astype(str)

for i, x in tqdm.tqdm(enumerate(all_nodes)):
    xes.append(x.x * 0.2)
    time_xes.append(x.x_time * 0.018)
    yes.append(x.y / 40000)
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

f = gzip.open("../public/nodelist.pb.gz", "wb")
f.write(all_data.SerializeToString())
f.close()
