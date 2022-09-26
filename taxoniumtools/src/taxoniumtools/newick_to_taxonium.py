#python usher_to_taxonium.py --input public-latest.all.masked.pb.gz --output ../taxonium_web_client/public/public2.jsonl.gz --metadata public-latest.metadata.tsv.gz --genbank hu1.gb --columns genbank_accession,country,date,pangolin_lineage

from ftplib import all_errors
import orjson
import json
import pandas as pd
from alive_progress import config_handler, alive_it, alive_bar

from . import ushertools
from . import utils
import argparse
import gzip

import treeswift
try:
    from . import _version
    version = _version.version
except ImportError:
    version = "dev"


def do_processing(input_file,
                  output_file,
                  metadata_file=None,
                  genbank_file=None,
                  columns=None,
                  chronumental_enabled=False,
                  chronumental_steps=100,
                  chronumental_date_output=None,
                  chronumental_tree_output=None,
                  chronumental_reference_node=None,
                  config_file=None,
                  title=None,
                  overlay_html=None,
                  remove_after_pipe=False,
                  clade_types=None,
                  name_internal_nodes=False,
                  shear=False,
                  shear_threshold=1000,
                  only_variable_sites=False,
                  key_column="strain"):

    metadata_dict, metadata_cols = utils.read_metadata(metadata_file, columns,
                                                       key_column)

    if config_file is not None:
        config = json.load(open(config_file))
    else:
        config = {}

    if title is not None:
        config['title'] = title

    if overlay_html is not None:
        html_content = open(overlay_html).read()
        config['overlay'] = html_content

    if "gz" in input_file:
        f = gzip.open(input_file, 'rt')
    else:
        f = open(input_file, 'rt')

    # get all comtents
    all_contents = f.read()
    # remove line breaks
    all_contents = all_contents.replace("\n", "")
    # remove spaces
    all_contents = all_contents.replace(" ", "")

    tree = treeswift.read_tree_newick(all_contents)

    print("Ladderizing tree..")
    tree.ladderize(ascending=False)
    print("Ladderizing done")

    for node in tree.traverse_postorder():
        if node.is_leaf():
            node.num_tips = 1
        else:
            node.num_tips = sum(child.num_tips for child in node.children)
    total_tips = tree.root.num_tips
    utils.set_x_coords(tree.root, chronumental_enabled=False)
    utils.set_terminal_y_coords(tree.root)
    utils.set_internal_y_coords(tree.root)

    nodes_sorted_by_y = utils.sort_on_y(tree)

    config['num_tips'] = total_tips

    first_json = {
        "version": version,
        "mutations": [],
        "total_nodes": len(nodes_sorted_by_y),
        "config": config
    }

    node_to_index = {node: i for i, node in enumerate(nodes_sorted_by_y)}

    if "gz" in output_file:
        output_file = gzip.open(output_file, 'wb')
    else:
        output_file = open(output_file, 'wb')
    output_file.write(orjson.dumps(first_json) + b"\n")
    for node in alive_it(
            nodes_sorted_by_y,
            title="Converting each node, and writing out in JSON"):
        node_object = utils.get_node_object(
            node,
            node_to_index,
            metadata_dict, {},
            metadata_cols,
            chronumental_enabled=chronumental_enabled)
        if remove_after_pipe and 'name' in node_object and node_object['name']:
            node_object['name'] = node_object['name'].split("|")[0]
        output_file.write(orjson.dumps(node_object) + b"\n")
    output_file.close()

    print(
        f"Done. Output written to {output_file.name}, with {len(nodes_sorted_by_y)} nodes."
    )


def get_parser():
    parser = argparse.ArgumentParser(
        description='Convert a Newick file to Taxonium jsonl format')
    parser.add_argument('-i',
                        '--input',
                        type=str,
                        help='File path to input Newick file',
                        required=True)
    parser.add_argument('-o',
                        '--output',
                        type=str,
                        help='File path for output Taxonium jsonl file',
                        required=True)
    parser.add_argument('-m',
                        '--metadata',
                        type=str,
                        help='File path for input metadata file (CSV/TSV)')

    parser.add_argument(
        '-c',
        "--columns",
        type=str,
        help=
        "Column names to include in the metadata, separated by commas, e.g. `pangolin_lineage,country`"
    )

    parser.add_argument(
        '-j',
        "--config_json",
        type=str,
        help=
        "A JSON file to use as a config file containing things such as search parameters",
        default=None)
    parser.add_argument(
        '-t',
        "--title",
        type=str,
        help=
        "A title for the tree. This will be shown at the top of the window as \"[Title] - powered by Taxonium\"",
        default=None)
    parser.add_argument(
        "--overlay_html",
        type=str,
        help=
        "A file containing HTML to put in the About box when this tree is loaded. This could contain information about who built the tree and what data you used.",
        default=None)

    parser.add_argument(
        "--key_column",
        type=str,
        help=
        "The column in the metadata file which is the same as the names in the tree",
        default="strain")

    return parser


def main():
    parser = get_parser()

    args = parser.parse_args()
    do_processing(args.input,
                  args.output,
                  metadata_file=args.metadata,
                  columns=args.columns,
                  config_file=args.config_json,
                  title=args.title,
                  overlay_html=args.overlay_html,
                  key_column=args.key_column)


if __name__ == "__main__":
    main()
