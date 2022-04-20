from collections import defaultdict
from alive_progress import alive_it
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

