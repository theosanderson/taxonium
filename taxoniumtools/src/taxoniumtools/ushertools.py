from concurrent.futures import thread
from . import parsimony_pb2
import treeswift
from alive_progress import alive_it, alive_bar
from Bio import SeqIO
from typing import ClassVar

from dataclasses import dataclass
from collections import defaultdict


def reverse_complement(input_string):
    return input_string.translate(str.maketrans("ATCG", "TAGC"))[::-1]


@dataclass(eq=True, frozen=True)
class AnnotatedMutation:
    genome_position: int  #0-based
    genome_residue: str
    codon_number: int  #0-based
    codon_start: int  #0-based
    codon_end: int  #0-based
    gene: str
    strand: int


@dataclass(eq=True, frozen=True)
class AAMutation:
    gene: str
    one_indexed_codon: int
    initial_aa: str
    final_aa: str
    nuc_for_codon: int
    type: str = "aa"


@dataclass(eq=True, frozen=True)
class NucMutation:  #hashable
    one_indexed_position: int
    par_nuc: str
    mut_nuc: str
    chromosome: str = "chrom"
    type: str = "nt"


@dataclass(eq=True, frozen=True)
class Gene:
    name: str
    strand: int
    start: int
    end: int


def get_codon_table():
    bases = "TCAG"
    codons = [a + b + c for a in bases for b in bases for c in bases]
    amino_acids = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
    return dict(zip(codons, amino_acids))


codon_table = get_codon_table()


def get_gene_name(cds):
    """Returns gene if available, otherwise locus tag"""
    if "gene" in cds.qualifiers:
        return cds.qualifiers["gene"][0]
    elif "locus_tag" in cds.qualifiers:
        return cds.qualifiers["locus_tag"][0]
    else:
        raise ValueError(f"No gene name or locus tag for {cds}")


def get_genes_dict(cdses):
    genes = {}
    for cds in cdses:
        genes[get_gene_name(cds)] = Gene(get_gene_name(cds), cds.strand,
                                         cds.location.start, cds.location.end)
    return genes


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
                    gene=get_gene_name(cds),
                    codon_number=codon_number,
                    codon_start=codon_start,
                    codon_end=codon_end,
                    strand=cds.strand))

    by_gene_codon = defaultdict(list)

    for mutation in annotated_mutations:
        by_gene_codon[(mutation.gene, mutation.codon_number,
                       mutation.codon_start, mutation.codon_end,
                       mutation.strand)].append(mutation)

    mutations_here = []
    for gene_codon, mutations in by_gene_codon.items():
        gene, codon_number, codon_start, codon_end, strand = gene_codon
        very_initial_codon = seq[codon_start:codon_end]
        # For most of this function we ignore strand - so for negative strand we
        # are actually collecting the reverse complement of the codon
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

        if strand == -1:
            initial_codon = reverse_complement(initial_codon)
            final_codon = reverse_complement(final_codon)

        initial_codon_trans = codon_table[initial_codon]
        final_codon_trans = codon_table[final_codon]
        if initial_codon_trans != final_codon_trans or disable_check_for_differences:
            #(gene, codon_number + 1, initial_codon_trans, final_codon_trans)

            mutations_here.append(
                AAMutation(gene=gene,
                           one_indexed_codon=codon_number + 1,
                           initial_aa=initial_codon_trans,
                           final_aa=final_codon_trans,
                           nuc_for_codon=codon_start + 1))

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


def preorder_traversal_internal(node):
    yield node
    for clade in node.children:
        for x in preorder_traversal_internal(clade):
            if not x.is_leaf():
                yield x


def preorder_traversal_iter(node):
    return iter(preorder_traversal(node))


def find_cds(position, cdses):
    for cds in cdses:
        if cds.location.start <= position <= cds.location.end:
            return cds
    return None


def find_codon(position, cds):
    if cds.strand == 1:
        # Get the codon number within the CDS
        codon_number = (position - cds.location.start) // 3
        codon_start = cds.location.start + codon_number * 3
        codon_end = codon_start + 3
    else:
        # Get the codon number within the CDS
        codon_number = (cds.location.end - position - 1) // 3
        codon_end = cds.location.end - codon_number * 3
        codon_start = codon_end - 3
    return codon_number, codon_start, codon_end


class UsherMutationAnnotatedTree:

    def __init__(self,
                 tree_file,
                 genbank_file=None,
                 name_internal_nodes=False,
                 clade_types=[],
                 shear=False,
                 shear_threshold=1000):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)
        print("Loading tree, this may take a while...")
        self.tree = treeswift.read_tree(self.data.newick, schema="newick")
        if name_internal_nodes:
            self.name_internal_nodes()
        self.data.newick = ''

        self.annotate_mutations()
        self.annotate_clades(clade_types)

        self.expand_condensed_nodes()
        self.assign_num_tips()
        print(f"Loaded initial tree with {self.tree.root.num_tips} tips")
        if shear:
            print("Shearing tree...")
            self.shear_tree(shear_threshold)
        self.assign_num_tips()
        print(f"Tree to use now has {self.tree.root.num_tips} tips")
        self.set_branch_lengths()
        if genbank_file:
            self.load_genbank_file(genbank_file)
            self.get_root_sequence()
            self.perform_aa_analysis()

    def prune_node(self, node_to_prune):
        """Remove node from parent, then check if parent has zero descendants. If so remove it.
        If parent has a single descendant, then give the parent's mutations to the descendant, unless they
        conflict with the descendants own mutations. Also give the parent's clade annotations to the descendant,
        unless they conflict. Then prune the parent, and instead add this child to parent's parent."""
        parent = node_to_prune.parent
        parent.remove_child(node_to_prune)
        if len(parent.children) == 0:
            self.prune_node(parent)
        elif len(parent.children) == 1:
            child = parent.children[0]
            for mutation in parent.nuc_mutations:
                if mutation.one_indexed_position not in [
                        x.one_indexed_position for x in child.nuc_mutations
                ]:
                    child.nuc_mutations.append(mutation)
            if hasattr(parent, "clades"):
                for clade_type, clade_annotation in parent.clades.items():
                    if clade_type not in child.clades or child.clades[
                            clade_type] == "":
                        child.clades[clade_type] = clade_annotation
            grandparent = parent.parent
            parent.remove_child(child)
            if grandparent:
                grandparent.remove_child(parent)
                grandparent.add_child(child)

    def shear_tree(self, theshold=1000):
        """Consider each node. If at any point a child has fewer than 1/threshold proportion of the num_tips, then prune it"""
        for node in alive_it(list(self.tree.traverse_postorder())):
            if (node == self.tree.root):
                continue
            if len(node.children) > 1:
                biggest_child = max(node.children, key=lambda x: x.num_tips)
                for child in list(node.children):
                    if biggest_child.num_tips / child.num_tips > theshold:
                        self.prune_node(child)

    def create_mutation_like_objects_to_record_root_seq(self):
        """Hacky way of recording the root sequence"""
        ref_muts = []
        for i, character in enumerate(self.root_sequence):
            ref_muts.append(
                NucMutation(one_indexed_position=i + 1,
                            mut_nuc=character,
                            par_nuc="X"))
        return ref_muts

    def annotate_clades(self, clade_types):
        if clade_types:
            for i, node in alive_it(list(
                    enumerate(preorder_traversal(self.tree.root))),
                                    title="Annotating clades"):

                this_thing = self.data.metadata[i]
                node.clades = {
                    clade_types[index]: part
                    for index, part in enumerate(this_thing.clade_annotations)
                }

    def perform_aa_analysis(self):

        seq = str(self.genbank.seq)
        with alive_bar(self.tree.num_nodes(),
                       title="Annotating amino acids") as pbar:
            recursive_mutation_analysis(self.tree.root, {}, seq, self.cdses,
                                        pbar)
        root_muts = self.create_mutation_like_objects_to_record_root_seq()
        self.tree.root.aa_muts = get_mutations(
            {}, root_muts, seq, self.cdses, disable_check_for_differences=True)
        self.tree.root.nuc_mutations = root_muts

    def load_genbank_file(self, genbank_file):
        self.genbank = SeqIO.read(genbank_file, "genbank")
        self.cdses = [x for x in self.genbank.features if x.type == "CDS"]
        # Assert that there are no compound locations and that all strands are positive,
        # and that all CDS features are a multiple of 3

        for cds in self.cdses:

            #assert cds.location.strand == 1
            assert len(cds.location.parts) == 1
            assert len(cds.location.parts[0]) % 3 == 0

        self.genes = get_genes_dict(self.cdses)

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

    def get_root_sequence(self):
        collected_mutations = {}
        for i, node in alive_it(list(
                enumerate(self.tree.root.traverse_postorder())),
                                title="Getting root sequence"):
            if node == self.tree.root:
                continue
            for mutation in node.nuc_mutations:
                collected_mutations[
                    mutation.one_indexed_position] = mutation.par_nuc
        self.root_sequence = list(str(self.genbank.seq))
        for i, character in enumerate(self.root_sequence):
            if i + 1 in collected_mutations:
                self.root_sequence[i] = collected_mutations[i + 1]
        self.root_sequence = "".join(self.root_sequence)

    def name_internal_nodes(self):
        for i, node in alive_it(list(
                enumerate(preorder_traversal_internal(self.tree.root))),
                                title="Naming internal nodes"):
            if not node.label:
                node.label = "node_" + str(i + 1)

    def set_branch_lengths(self):
        for node in alive_it(list(preorder_traversal(self.tree.root)),
                             title="Setting branch length"):
            node.edge_length = len(node.nuc_mutations)

    def expand_condensed_nodes(self):
        for node in alive_it(list(self.tree.traverse_leaves()),
                             title="Expanding condensed nodes"):

            if node.label and node.label in self.condensed_nodes_dict:
                assert len(node.nuc_mutations) == 0

                for new_node_label in self.condensed_nodes_dict[node.label]:
                    new_node = treeswift.Node(label=new_node_label)
                    new_node.nuc_mutations = node.nuc_mutations
                    if hasattr(node, "clades"):
                        new_node.clades = node.clades
                    node.parent.add_child(new_node)
                node.label = ""
                node.parent.remove_child(node)
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
