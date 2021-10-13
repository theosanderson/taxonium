import dendropy
import parsimony_pb2, tqdm

from Bio import Phylo


class UsherMutationAnnotatedTree:
    def __init__(self, tree_file):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)

        self.tree = dendropy.Tree.get(data=self.data.newick, schema="newick")
        self.annotate_mutations()
        self.set_branch_lengths()
        self.expand_condensed_nodes()

    def annotate_mutations(self):
        for i, node in enumerate(self.tree.preorder_node_iter()):
            node.nuc_mutations = self.data.node_mutations[i]

    def expand_condensed_nodes(self):
        for i, node in tqdm.tqdm(enumerate(self.tree.leaf_nodes()),
                                 desc="Expanding condensed nodes"):

            if node.taxon and node.taxon.label in self.condensed_nodes_dict:
                assert node.edge_length == 0
                for new_node_label in self.condensed_nodes_dict[
                        node.taxon.label]:
                    new_node = dendropy.Node(
                        taxon=dendropy.Taxon(new_node_label))

                    node.parent_node.add_child(new_node)
                node.parent_node.remove_child(node)

    def get_condensed_nodes_dict(self, condensed_nodes_dict):
        output_dict = {}
        for condensed_node in tqdm.tqdm(condensed_nodes_dict,
                                        desc="Reading condensed nodes dict"):
            output_dict[condensed_node.node_name.replace(
                "_", " ")] = condensed_node.condensed_leaves
        return output_dict

    def set_branch_lengths(self):
        for i, node in enumerate(self.tree.preorder_node_iter()):
            node.edge_length = len(node.nuc_mutations.mutation)


import io


def get_parent(tree, child_clade):
    node_path = tree.get_path(child_clade)
    return node_path[-2]


# The same but using BioPython
class UsherMutationAnnotatedTreeBioPython:
    def __init__(self, tree_file):
        self.data = parsimony_pb2.data()
        self.data.ParseFromString(tree_file.read())
        self.condensed_nodes_dict = self.get_condensed_nodes_dict(
            self.data.condensed_nodes)
        self.tree = Phylo.read(io.StringIO(self.data.newick), "newick")
        #print("aa", self.condensed_nodes_dict)
        self.annotate_mutations()
        self.set_branch_lengths()
        self.name_nodes()
        self.expand_condensed_nodes()

    def annotate_mutations(self):
        for i, node in enumerate(self.tree.find_clades()):
            node.nuc_mutations = self.data.node_mutations[i]

    def name_nodes(self):
        for i, node in enumerate(self.tree.find_clades()):
            if not node.name:
                node.name = f"node_{i}"

    def expand_condensed_nodes(self):
        for i, parent in tqdm.tqdm(enumerate(self.tree.find_clades()),
                                   desc="Expanding condensed nodes"):
            for node in parent.clades:
                if node.name in self.condensed_nodes_dict:
                    assert node.branch_length == 0
                    for new_node_label in self.condensed_nodes_dict[node.name]:
                        new_node = Phylo.BaseTree.Clade(name=new_node_label)
                        parent.clades.append(new_node)
                    parent.clades.remove(node)
                else:
                    # print(node.name)
                    pass

    def get_condensed_nodes_dict(self, condensed_nodes_dict):
        output_dict = {}
        for condensed_node in tqdm.tqdm(condensed_nodes_dict,
                                        desc="Reading condensed nodes dict"):
            output_dict[
                condensed_node.node_name] = condensed_node.condensed_leaves
        return output_dict

    def set_branch_lengths(self):
        for i, node in enumerate(self.tree.find_clades()):
            node.branch_length = len(node.nuc_mutations.mutation)


# f = open("./public-2021-09-15.all.masked.pb", "rb")
# mat = UsherMutationAnnotatedTree(f)
# mat.tree.write(path="./done.newick", schema="newick")

f = open("./public-2021-09-15.all.masked.pb", "rb")
mat = UsherMutationAnnotatedTreeBioPython(f)
Phylo.write(mat.tree, "./done_bp.newick", "newick")
