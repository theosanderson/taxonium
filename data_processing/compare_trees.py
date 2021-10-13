from Bio import Phylo

tree1_path = "new2.nwk"
tree2_path = "done_bp.newick"
print("B")
tree1 = Phylo.read(tree1_path, "newick")
print("B")
tree2 = Phylo.read(tree2_path, "newick")
print("B")
tree1_preorder = tree1.find_clades()
tree2_preorder = tree2.find_clades()
print("B")
for node1 in tree1_preorder:
    node2 = next(tree2_preorder)
    if node1.name != node2.name:
        # print(node1.name, node2.name)
        pass
    if node1.branch_length != node2.branch_length and node2.branch_length is not None:
        print(node1.name, node2.name, node1.branch_length, node2.branch_length)
