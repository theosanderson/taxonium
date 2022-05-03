#python usher_to_taxonium.py --input public-latest.all.masked.pb.gz --output ../taxonium_web_client/public/public2.jsonl.gz --metadata public-latest.metadata.tsv.gz --genbank hu1.gb --columns genbank_accession,country,date,pangolin_lineage

import json
import pandas as pd
from alive_progress import config_handler, alive_it, alive_bar
import treeswift
import tempfile
from . import ushertools
import argparse
import gzip
import os
import sys
import warnings

try:
    from . import _version
    version = _version.version
except ImportError:
    version = "dev"


def main():
    parser = argparse.ArgumentParser(
        description='Convert a Usher pb to Taxonium jsonl format')
    parser.add_argument('--input',
                        type=str,
                        help='Input Usher pb file',
                        required=True)
    parser.add_argument('--output',
                        type=str,
                        help='Output jsonl file',
                        required=True)
    parser.add_argument('--metadata', type=str, help='Metadata file')
    parser.add_argument('--genbank',
                        type=str,
                        help='Genbank file',
                        required=True)
    parser.add_argument('--chronumental',
                        action='store_true',
                        help='If set, we will run chronumental')
    parser.add_argument('--chronumental_steps',
                        type=int,
                        help='Number of steps to run chronumental for')
    parser.add_argument("--columns",
                        type=str,
                        help="Columns to include in the metadata")

    parser.add_argument("--config_json",
                        type=str,
                        help="A JSON file to use as a config file",
                        default=None)

    parser.add_argument("--taxonium_date_file_output",
                        type=str,
                        help="Output file for the taxonium date file, if any")

    parser.add_argument("--chronumental_reference_node",
                        type=str,
                        help="Taxonium reference node",
                        default=None)

    parser.add_argument('--gzlevel', type=int, help='Gzip level', default=6)

    args = parser.parse_args()

    if args.config_json is not None:
        config = json.load(open(args.config_json))
    else:
        config = {}

    must_have_cols = ['strain']
    cols_of_interest = set(args.columns.split(",")) if args.columns else set()
    cols_of_interest.update(must_have_cols)
    cols_of_interest = list(cols_of_interest)

    #only load these cols:
    if args.metadata:
        print("Loading metadata file..")
        #Disable warnings because of DTypeWarning in pandas

        warnings.filterwarnings("ignore")
        metadata = pd.read_csv(args.metadata,
                               sep="\t" if args.metadata.endswith(".tsv")
                               or args.metadata.endswith(".tsv.gz") else ",",
                               usecols=cols_of_interest)
        # Enable again
        warnings.filterwarnings("default")
        metadata.set_index("strain", inplace=True)
        # convert metadata to dict of rows

        metadata_dict = metadata.to_dict("index")
        metadata_cols = metadata.columns
        del metadata
        print("Metadata loaded")
    else:
        metadata_dict = {}
        metadata_cols = []

    #config_handler.set_global(force_tty=True) # Uncommenting this will force progress bars

    if "gz" in args.input:
        f = gzip.open(args.input, 'rb')
    else:
        f = open(args.input, 'rb')

    mat = ushertools.UsherMutationAnnotatedTree(f, args.genbank)
    f.close()

    if args.chronumental:
        chronumental_is_available = os.system(
            "which chronumental > /dev/null") == 0
        if not chronumental_is_available:
            print("#####  Chronumental is not available.  #####")
            print(
                "#####  Please install it with `pip install chronumental` and restart. Or you can disable the --chronumental flag.  #####"
            )
            print("#####  Exiting.  #####")
            sys.exit(1)
        with tempfile.TemporaryDirectory() as tmpdirname:
            mat.tree.write_tree_newick(
                os.path.join(tmpdirname, "distance_tree.nwk"))

            print("Launching chronumental")

            command = f"chronumental --tree {os.path.join(tmpdirname, 'distance_tree.nwk')} --dates {args.metadata} --steps {args.chronumental_steps} --tree_out {os.path.join(tmpdirname, 'timetree.nwk')}"
            if args.chronumental_reference_node:
                command += f" --reference_node {args.chronumental_reference_node}"

            if args.taxonium_date_file_output:
                command += f" --dates_out {args.taxonium_date_file_output}"
            result = os.system(command)
            if result != 0:
                print("#####  Chronumental failed.  #####")
                print("#####  Exiting.  #####")
                sys.exit(1)

            # %%

            print("Reading time tree")
            time_tree = treeswift.read_tree(os.path.join(
                tmpdirname, "timetree.nwk"),
                                            schema="newick")
            time_tree_iter = ushertools.preorder_traversal(time_tree.root)
            for i, node in alive_it(enumerate(
                    ushertools.preorder_traversal(mat.tree.root)),
                                    title="Adding time tree"):
                time_tree_node = next(time_tree_iter)
                if args.chronumental:
                    node.time_length = time_tree_node.edge_length
            del time_tree
            del time_tree_iter

    def set_x_coords(root):
        """ Set x coordinates for the tree"""
        root.x_dist = 0
        root.x_time = 0
        for node in alive_it(root.traverse_preorder(),
                             title="Setting x coordinates"):
            if node.parent:
                node.x_dist = node.parent.x_dist + node.edge_length
                if args.chronumental:
                    node.x_time = node.parent.x_time + node.time_length

    def set_terminal_y_coords(root):
        for i, node in alive_it(enumerate(root.traverse_leaves()),
                                title="Setting terminal y coordinates"):
            node.y = i
            node.y = i

    def set_internal_y_coords(root):
        # Each node should be halfway between the min and max y of its children
        for node in alive_it(root.traverse_postorder(leaves=False,
                                                     internal=True),
                             title="Setting internal y coordinates"):

            child_ys = [child.y for child in node.children]
            node.y = (min(child_ys) + max(child_ys)) / 2

    def get_all_aa_muts(root):
        all_aa_muts = set()
        for node in alive_it(list(root.traverse_preorder()),
                             title="Collecting all AA mutations"):
            if node.aa_muts:
                all_aa_muts.update(node.aa_muts)
        return list(all_aa_muts)

    def get_all_nuc_muts(root):
        all_nuc_muts = set()
        for node in alive_it(list(root.traverse_preorder()),
                             title="Collecting all nuc mutations"):
            if node.nuc_mutations:
                all_nuc_muts.update(node.nuc_mutations)
        return list(all_nuc_muts)

    def make_aa_object(i, aa_tuple):
        # Tuple format is gene, position, prev, next
        gene, pos, prev, next = aa_tuple
        return {
            "gene": gene,
            "previous_residue": prev,
            "residue_pos": pos,
            "new_residue": next,
            "mutation_id": i,
            "type": "aa"
        }

    def make_nuc_object(i, nuc_mut):
        return {
            "gene": "nt",
            "previous_residue": nuc_mut.par_nuc,
            "residue_pos": nuc_mut.one_indexed_position,
            "new_residue": nuc_mut.mut_nuc,
            "mutation_id": i,
            "type": "nt"
        }

    def get_node_object(node, node_to_index, metadata, input_to_index,
                        columns):

        object = {}
        object["name"] = node.label if node.label else ""
        # round to 5 dp
        object["x_dist"] = round(node.x_dist, 5)
        if args.chronumental:
            object["x_time"] = round(node.x_time, 5)
        object["y"] = node.y
        object['mutations'] = [
            input_to_index[my_input] for my_input in node.aa_muts
        ] + [input_to_index[my_input] for my_input in node.nuc_mutations]
        # check if label is in metadata's index
        try:
            my_dict = metadata[node.label]
            for key in my_dict:
                value = my_dict[key]
                #if value is pd.NaN then set to empty string
                if pd.isna(value):
                    value = ""
                object["meta_" + key] = value
        except KeyError:
            for key in columns:
                object["meta_" + key] = ""

        object['parent_id'] = node_to_index[
            node.parent] if node.parent else node_to_index[node]
        object['node_id'] = node_to_index[
            node]  # We don't strictly need this, but it doesn't add much to the space

        object['num_tips'] = node.num_tips
        return object

    print("Ladderizing tree..")
    mat.tree.ladderize(ascending=False)
    print("Ladderizing done")
    set_x_coords(mat.tree.root)
    set_terminal_y_coords(mat.tree.root)
    set_internal_y_coords(mat.tree.root)

    with alive_bar(title="Sorting on y") as bar:

        def return_y(node):
            bar()
            return node.y

        nodes_sorted_by_y = sorted(mat.tree.root.traverse_preorder(),
                                   key=lambda x: return_y(x))

    all_aa_muts_tuples = get_all_aa_muts(mat.tree.root)
    all_nuc_muts = get_all_nuc_muts(mat.tree.root)
    all_mut_inputs = all_aa_muts_tuples + all_nuc_muts
    all_mut_objects = [
        make_aa_object(i, input_thing)
        if isinstance(input_thing, tuple) else make_nuc_object(i, input_thing)
        for i, input_thing in enumerate(all_mut_inputs)
    ]
    input_to_index = {
        input_thing: i
        for i, input_thing in enumerate(all_mut_inputs)
    }

    first_json = {
        "version": version,
        "mutations": all_mut_objects,
        "total_nodes": len(nodes_sorted_by_y),
        "config": config
    }

    node_to_index = {node: i for i, node in enumerate(nodes_sorted_by_y)}

    if "gz" in args.output:
        output_file = gzip.open(args.output, 'wt', compresslevel=args.gzlevel)
    else:
        output_file = open(args.output, 'wt')
    output_file.write(json.dumps(first_json, separators=(',', ':')) + "\n")
    for node in alive_it(
            nodes_sorted_by_y,
            title="Converting each node, and writing out in JSON"):
        node_object = get_node_object(node, node_to_index, metadata_dict,
                                      input_to_index, metadata_cols)
        output_file.write(
            json.dumps(node_object, separators=(',', ':')) + "\n")
    output_file.close()

    print(
        f"Done. Output written to {args.output}, with {len(nodes_sorted_by_y)} nodes."
    )


if __name__ == "__main__":
    main()
