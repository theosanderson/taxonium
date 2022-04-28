from . import parsimony_pb2
import treeswift
from alive_progress import alive_it, alive_bar
from Bio import SeqIO

from dataclasses import dataclass
from collections import defaultdict


@dataclass
class AnnotatedMutation:  #not-hashable atm
    genome_position: int  #0-based
    genome_residue: str
    cds: lambda: "CDS"
    codon_number: int  #0-based
    codon_start: int  #0-based
    codon_end: int  #0-based
    gene: str


@dataclass(eq=True, frozen=True)
class NucMutation:  #hashable
    one_indexed_position: int
    par_nuc: str
    mut_nuc: str
    chromosome: str = "chrom"


def get_codon_table():
    bases = "TCAG"
    codons = [a + b + c for a in bases for b in bases for c in bases]
    amino_acids = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
    return dict(zip(codons, amino_acids))


codon_table = get_codon_table()


def get_mutations(past_nuc_muts_dict,
                  new_nuc_mutations_here,
                  seq,
                  cdses,
                  disable_check_for_differences=False):

    annotated_mutations = []

    for mutation in new_nuc_mutations_here:
        cds = find_cds(mutation.one_indexed_position - 1, cdses)
        if cds:
            codon_number, codon_start, codon_end = find_codon(
                mutation.one_indexed_position - 1, cds)
            annotated_mutations.append(
                AnnotatedMutation(
                    genome_position=mutation.one_indexed_position - 1,
                    genome_residue=mutation.mut_nuc,
                    gene=cds.qualifiers["gene"][0],
                    codon_number=codon_number,
                    codon_start=codon_start,
                    codon_end=codon_end,
                    cds=cds))

    by_gene_codon = defaultdict(list)

    for mutation in annotated_mutations:
        by_gene_codon[(mutation.gene, mutation.codon_number,
                       mutation.codon_start,
                       mutation.codon_end)].append(mutation)

    mutations_here = []
    for gene_codon, mutations in by_gene_codon.items():
        gene, codon_number, codon_start, codon_end = gene_codon
        very_initial_codon = seq[codon_start:codon_end]
        initial_codon = list(very_initial_codon)

        relevant_past_muts = [(x, past_nuc_muts_dict[x])
                              for x in range(codon_start, codon_end)
                              if x in past_nuc_muts_dict]
        for position, value in relevant_past_muts:
            initial_codon[position - codon_start] = value

        final_codon = initial_codon.copy()

        for mutation in mutations:
            pos_in_codon = mutation.genome_position - codon_start
            final_codon[pos_in_codon] = mutation.genome_residue

        initial_codon = "".join(initial_codon)
        final_codon = "".join(final_codon)
        initial_codon_trans = codon_table[initial_codon]
        final_codon_trans = codon_table[final_codon]
        if initial_codon_trans != final_codon_trans or disable_check_for_differences:
            mutations_here.append((gene, codon_number + 1, initial_codon_trans,
                                   final_codon_trans))

    # update past_nuc_muts_dict
    for mutation in annotated_mutations:
        past_nuc_muts_dict[mutation.genome_position] = mutation.genome_residue

    return mutations_here


def recursive_mutation_analysis(node, past_nuc_muts_dict, seq, cdses, pbar):
    pbar()

    new_nuc_mutations_here = node.nuc_mutations
    new_past_nuc_muts_dict = past_nuc_muts_dict.copy()
    node.aa_muts = get_mutations(new_past_nuc_muts_dict,
                                 new_nuc_mutations_here, seq, cdses)
    for child in node.children:
        recursive_mutation_analysis(child, new_past_nuc_muts_dict, seq, cdses,
                                    pbar)


NUC_ENUM = "ACGT"


def preorder_traversal(node):
    yield node
    for clade in node.children:
        yield from preorder_traversal(clade)


def preorder_traversal_iter(node):
    return iter(preorder_traversal(node))


def find_cds(position, cdses):
    for cds in cdses:
        if cds.location.start <= position <= cds.location.end:
            return cds
    return None


def find_codon(position, cds):
    # Get the codon number within the CDS
    codon_number = (position - cds.location.start) // 3
    codon_start = cds.location.start + codon_number * 3
    codon_end = codon_start + 3
    return codon_number, codon_start, codon_end


class UsherMutationAnnotatedTree:

    def __init__(self, tree_file, genbank_file=None):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)
        print("Loading tree, this may take a while...")
        self.tree = treeswift.read_tree(self.data.newick, schema="newick")
        self.data.newick = ''

        self.annotate_mutations()

        self.expand_condensed_nodes()
        self.set_branch_lengths()
        if genbank_file:
            self.load_genbank_file(genbank_file)
            self.perform_aa_analysis()
        self.assign_num_tips()

    def create_mutation_like_objects_to_record_reference_seq(self):
        """Hacky way of recording the reference"""
        ref_muts = []
        for i, character in enumerate(self.genbank.seq):
            ref_muts.append(
                NucMutation(one_indexed_position=i + 1,
                            mut_nuc=character,
                            par_nuc="X"))
        return ref_muts

    def perform_aa_analysis(self):

        seq = str(self.genbank.seq)
        with alive_bar(self.tree.num_nodes(),
                       title="Annotating amino acids") as pbar:
            recursive_mutation_analysis(self.tree.root, {}, seq, self.cdses,
                                        pbar)
        reference_muts = self.create_mutation_like_objects_to_record_reference_seq(
        )
        self.tree.root.aa_muts = get_mutations(
            {},
            reference_muts,
            seq,
            self.cdses,
            disable_check_for_differences=True)
        self.tree.root.nuc_mutations = reference_muts

    def load_genbank_file(self, genbank_file):
        self.genbank = SeqIO.read(genbank_file, "genbank")
        self.cdses = [x for x in self.genbank.features if x.type == "CDS"]
        # Assert that there are no compound locations and that all strands are positive,
        # and that all CDS features are a multiple of 3

        for cds in self.cdses:

            assert cds.location.strand == 1
            assert len(cds.location.parts) == 1
            assert len(cds.location.parts[0]) % 3 == 0

    def convert_nuc_mutation(self, usher_mutation):
        new_mut = NucMutation(one_indexed_position=usher_mutation.position,
                              par_nuc=NUC_ENUM[usher_mutation.par_nuc],
                              mut_nuc=NUC_ENUM[usher_mutation.mut_nuc[0]])
        return new_mut

    def annotate_mutations(self):
        for i, node in alive_it(list(
                enumerate(preorder_traversal(self.tree.root))),
                                title="Annotating nuc muts"):
            node.nuc_mutations = [
                self.convert_nuc_mutation(x)
                for x in self.data.node_mutations[i].mutation
            ]

    def set_branch_lengths(self):
        for node in alive_it(list(preorder_traversal(self.tree.root)),
                             title="Setting branch length"):
            node.edge_length = len(node.nuc_mutations)

    def expand_condensed_nodes(self):
        for node in alive_it(list(self.tree.traverse_leaves()),
                             title="Expanding condensed nodes"):

            if node.label and node.label in self.condensed_nodes_dict:

                for new_node_label in self.condensed_nodes_dict[node.label]:
                    new_node = treeswift.Node(label=new_node_label)
                    new_node.nuc_mutations = []
                    node.add_child(new_node)
                node.label = ""
            else:
                pass

    def get_condensed_nodes_dict(self, condensed_nodes_dict):
        output_dict = {}
        for condensed_node in alive_it(condensed_nodes_dict,
                                       title="Reading condensed nodes dict"):
            output_dict[
                condensed_node.node_name] = condensed_node.condensed_leaves
        return output_dict

    def assign_num_tips(self):
        for node in self.tree.traverse_postorder():
            if node.is_leaf():
                node.num_tips = 1
            else:
                node.num_tips = sum(child.num_tips for child in node.children)
