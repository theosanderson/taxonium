#!/usr/bin/env python

# THIS SCRIPT NEEDS REFACTORING, IT'S GOT BODGED TOGETHER AND ONLY PARTIALLY CONVERTED TO DENDROPY
# SO DOESN'T MAKE BEST USE OF ITS FEATURES

from collections import defaultdict
import numpy as np
import pandas as pd
import tree_pb2
import tqdm

accessions = pd.read_table("epiToPublic.tsv.gz",
                           names=["epi_isl", "genbank", "alternative", "date"],
                           low_memory=False)

epi_isl_lookup = defaultdict(lambda: 0)

for i, row in tqdm.tqdm(accessions.iterrows()):
    epi_int = int(row['epi_isl'].replace("EPI_ISL_", ""))
    epi_isl_lookup[row['genbank']] = epi_int


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

import dendropy


class UsherMutationAnnotatedTree:
    def __init__(self, tree_file):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)
        self.tree = dendropy.Tree.get(data=self.data.newick, schema="newick")

        self.annotate_mutations()
        self.set_branch_lengths()
        self.annotate_aa_mutations()
        self.expand_condensed_nodes()

    def annotate_mutations(self):
        for i, node in enumerate(self.tree.preorder_node_iter()):
            node.nuc_mutations = self.data.node_mutations[i]

    def set_branch_lengths(self):
        for i, node in enumerate(self.tree.preorder_node_iter()):
            node.edge_length = len(node.nuc_mutations.mutation)

    def annotate_aa_mutations(self):
        for i, node in tqdm.tqdm(enumerate(self.tree.preorder_node_iter()),
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
        for i, node in tqdm.tqdm(enumerate(self.tree.leaf_nodes()),
                                 desc="Expanding condensed nodes"):

            if node.taxon and node.taxon.label in self.condensed_nodes_dict:
                assert node.edge_length == 0
                for new_node_label in self.condensed_nodes_dict[
                        node.taxon.label]:
                    new_node = dendropy.Node(
                        taxon=dendropy.Taxon(new_node_label))
                    new_node.nuc_mutations = node.nuc_mutations
                    new_node.aa_subs = node.aa_subs
                    node.parent_node.add_child(new_node)
                node.parent_node.remove_child(node)
    def rename_nodes_to_numbers(self, lookup):
        for i, node in tqdm.tqdm(enumerate(self.tree.leaf_nodes()),
                                 desc="Renaming nodes"):

            if node.taxon and node.taxon.label:
                node.taxon.label = lookup[node]

    def get_condensed_nodes_dict(self, condensed_nodes_dict):
        output_dict = {}
        for condensed_node in tqdm.tqdm(condensed_nodes_dict,
                                        desc="Reading condensed nodes dict"):
            output_dict[condensed_node.node_name.replace(
                "_", " ")] = condensed_node.condensed_leaves
        return output_dict


# In[19]:

f = open("./public-latest.all.masked.pb", "rb")

mat = UsherMutationAnnotatedTree(f)
mat.tree.ladderize()

all_ref_muts = set(get_aa_ref(x) for x in range(len(cov2_genome.seq)))
all_ref_muts = [x for x in all_ref_muts if x is not None]
mat.tree.seed_node.aa_subs = all_ref_muts

# In[14]:


def get_label_from_node(node):
    if node.taxon:
        return node.taxon.label
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


def assign_terminal_y(terminals):
    for i, node in enumerate(terminals):
        node.y = i


def align_parents(tree_by_level):
    for level in tqdm.tqdm(sorted(list(by_level.keys()), reverse=True)):
        for node in by_level[level]:
            childrens_y = [item.y for item in node.child_nodes()]
            if len(childrens_y):
                node.y = np.mean(childrens_y)


root = mat.tree.seed_node
assign_x(root)
terminals = mat.tree.leaf_nodes()
assign_terminal_y(terminals)
align_parents(by_level)

all_nodes = terminals
all_nodes.extend(mat.tree.internal_nodes())
all_nodes.sort(key=lambda x: x.y)
lookup = {x: i for i, x in enumerate(all_nodes)}


def add_paths(tree_by_level):
    for level in tqdm.tqdm(sorted(list(by_level.keys()))):
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
                       low_memory=False)
lineage_lookup = defaultdict(lambda: "")
date_lookup = defaultdict(lambda: "")
country_lookup = defaultdict(lambda: "")
genbank_lookup = defaultdict(lambda: "")
for i, row in tqdm.tqdm(metadata.iterrows()):

    name = row['strain']  #.split("|")[0]
    genbank_lookup[name] = str(row['genbank_accession'])
    lineage_lookup[name] = str(row['pangolin_lineage'])
    date_lookup[name] = str(row['date'])
    row['country'] = str(row['country']).replace("_", " ")
    if row['country'] == "UK":
        country_lookup[name] = row['strain'].split("/")[0].replace("_", " ")
    elif "Germany" in row['country']:
        country_lookup[name] = "Germany"
    elif "Austria" in row['country']:
        country_lookup[name] = "Austria"
    elif "USA" in row['country']:
        country_lookup[name] = "USA"
    else:
        country_lookup[name] = str(row['country'])

print("B")

alt_metadata = pd.read_csv("metadata.tsv.gz",
                       sep="\t",
                       low_memory=False)

alt_genbank_lookup = {}
for i, row in tqdm.tqdm(alt_metadata.iterrows()):

    name = row['strain']  #.split("|")[0]
    alt_genbank_lookup[name] = str(row['genbank_accession'])

def make_mapping(list_of_strings):
    sorted_by_value_counts = [""] + pd.Series(list_of_strings).value_counts(
        sort=True).index.tolist()
    return sorted_by_value_counts, {
        x: i
        for i, x in enumerate(sorted_by_value_counts)
    }


all_lineages = [x for i, x in lineage_lookup.items()]
lineage_mapping_list, lineage_mapping_lookup = make_mapping(all_lineages)

all_dates = [x for i, x in date_lookup.items()]
date_mapping_list, date_mapping_lookup = make_mapping(all_dates)

all_countries = [x for i, x in country_lookup.items()]
country_mapping_list, country_mapping_lookup = make_mapping(all_countries)

all_genotypes = []
for x in mat.tree.nodes():
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

print("C")
for i, x in tqdm.tqdm(enumerate(all_nodes)):
    xes.append(x.x * 0.2)
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
    
    genbank =genbank_lookup[name]
    if not genbank and final_name in alt_genbank_lookup and alt_genbank_lookup[final_name]!="?":
        genbank = alt_genbank_lookup[final_name]
    genbanks.append(genbank)
    the_date = date_lookup[name]

    dates.append(date_mapping_lookup[the_date])

    the_country = country_lookup[name]
    countries.append(country_mapping_lookup[the_country])

    the_lineage = lineage_lookup[name]
    lineages.append(lineage_mapping_lookup[the_lineage])
    mutations.append([mutation_mapping_lookup[y] for y in x.aa_subs])
    num_tips.append(len(x.leaf_nodes()))

    epi_isls.append(
        get_epi_isl(genbank_lookup[name], final_name, date_lookup[name]))

all_node_data = tree_pb2.AllNodeData(
    genbanks=genbanks,
    names=names,
    x=xes,
    y=yes,
    countries=countries,
    lineages=lineages,
    dates=dates,
    mutations=[tree_pb2.MutationList(mutation=x) for x in mutations],
    parents=parents,
    num_tips=num_tips,
    epi_isl_numbers=epi_isls)

all_data = tree_pb2.AllData(node_data=all_node_data,
                            country_mapping=country_mapping_list,
                            lineage_mapping=lineage_mapping_list,
                            mutation_mapping=mutation_mapping_list,
                            date_mapping=date_mapping_list)

f = open("../public/nodelist.pb", "wb")
f.write(all_data.SerializeToString())
f.close()

mat.rename_nodes_to_numbers(lookup)

mat.tree.write(path="output.tre", schema="newick")