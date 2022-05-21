#python usher_to_taxonium.py --input public-latest.all.masked.pb.gz --output ../taxonium_web_client/public/public2.jsonl.gz --metadata public-latest.metadata.tsv.gz --genbank hu1.gb --columns genbank_accession,country,date,pangolin_lineage

import orjson
import json
import pandas as pd
from alive_progress import config_handler, alive_it, alive_bar

from . import ushertools
from . import utils
import argparse
import gzip

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
                  name_internal_nodes=False):

    metadata_dict, metadata_cols = utils.read_metadata(metadata_file, columns)

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
        f = gzip.open(input_file, 'rb')
    else:
        f = open(input_file, 'rb')

    if clade_types:
        clade_types = clade_types.split(",")
    else:
        clade_types = []
    mat = ushertools.UsherMutationAnnotatedTree(
        f,
        genbank_file,
        clade_types=clade_types,
        name_internal_nodes=name_internal_nodes)
    f.close()

    if chronumental_enabled:
        utils.do_chronumental(
            mat=mat,
            chronumental_reference_node=chronumental_reference_node,
            metadata_file=metadata_file,
            chronumental_steps=chronumental_steps,
            chronumental_date_output=chronumental_date_output,
            chronumental_tree_output=chronumental_tree_output)

    print("Ladderizing tree..")
    mat.tree.ladderize(ascending=False)
    print("Ladderizing done")
    total_tips = mat.tree.root.num_tips
    utils.set_x_coords(mat.tree.root,
                       chronumental_enabled=chronumental_enabled)
    utils.set_terminal_y_coords(mat.tree.root)
    utils.set_internal_y_coords(mat.tree.root)

    nodes_sorted_by_y = utils.sort_on_y(mat)
    all_aa_muts_tuples = utils.get_all_aa_muts(mat.tree.root)
    all_nuc_muts = utils.get_all_nuc_muts(mat.tree.root)
    all_mut_inputs = all_aa_muts_tuples + all_nuc_muts
    all_mut_objects = [
        utils.make_aa_object(i, input_thing) if isinstance(input_thing, tuple)
        else utils.make_nuc_object(i, input_thing)
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
        "total_tips": total_tips,
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
            metadata_dict,
            input_to_index,
            metadata_cols,
            chronumental_enabled=chronumental_enabled)
        if remove_after_pipe and 'name' in node_object and node_object['name']:
            node_object['name'] = node_object['name'].split("|")[0]
        output_file.write(orjson.dumps(node_object) + b"\n")
    output_file.close()

    print(
        f"Done. Output written to {output_file}, with {len(nodes_sorted_by_y)} nodes."
    )


def get_parser():
    parser = argparse.ArgumentParser(
        description='Convert a Usher pb to Taxonium jsonl format')
    parser.add_argument('-i',
                        '--input',
                        type=str,
                        help='File path to input Usher protobuf file (.pb)',
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
        '-g',
        '--genbank',
        type=str,
        help=
        'File path for GenBank file containing reference genome (N.B. currently only forward genes are supported, and only one chromosome, and no compound features)'
    )
    parser.add_argument(
        '-c',
        "--columns",
        type=str,
        help=
        "Column names to include in the metadata, separated by columns, e.g. `pangolin_lineage,country`"
    )
    parser.add_argument(
        '-C',
        '--chronumental',
        action='store_true',
        help=
        'Runs Chronumental to build a time tree. The metadata TSV must include a date column.'
    )
    parser.add_argument('--chronumental_steps',
                        type=int,
                        help='Number of steps to run Chronumental for')
    parser.add_argument(
        "--chronumental_date_output",
        type=str,
        help=
        "Optional output file for the chronumental date table if you want to keep it (a table mapping nodes to their inferred dates)."
    )
    parser.add_argument(
        "--chronumental_tree_output",
        type=str,
        help=
        "Optional output file for the chronumental time tree file in nwk format."
    )
    parser.add_argument(
        "--chronumental_reference_node",
        type=str,
        help=
        "A reference node to be used for Chronumental. This should be earlier in the outbreak and have a good defined date. If not set the oldest sample will be automatically picked by Chronumental.",
        default=None)
    parser.add_argument(
        '-j',
        "--config_json",
        type=str,
        help=
        "A JSON file to use as a config file containing things such as search parameters",
        default=None)
    parser.add_argument('-t',
                        "--title",
                        type=str,
                        help="A title for the tree",
                        default=None)
    parser.add_argument(
        "--overlay_html",
        type=str,
        help=
        "A file containing HTML to put in the About box when this tree is loaded",
        default=None)
    parser.add_argument(
        '--remove_after_pipe',
        action='store_true',
        help=
        'If set, we will remove anything after a pipe (|) in each node\'s name, after joining to metadata'
    )
    parser.add_argument(
        "--clade_types",
        type=str,
        help=
        "Optionally specify clade types provided in the UShER file, comma separated - e.g. 'nextstrain,pango'. Order must match that used in the UShER pb file.",
        default=None)
    parser.add_argument('--name_internal_nodes',
                        action='store_true',
                        help='If set, we will name internal nodes node_xxx')
    parser.add_argument("--shear",
                        action='store_true',
                        help="If set, we will shear the tree")
    parser.add_argument('--shear_threshold',
                        type=float,
                        help='How to shear tree',
                        default=1000)
    return parser


def main():
    parser = get_parser()

    args = parser.parse_args()
    do_processing(args.input,
                  args.output,
                  metadata_file=args.metadata,
                  genbank_file=args.genbank,
                  chronumental_enabled=args.chronumental,
                  chronumental_steps=args.chronumental_steps,
                  columns=args.columns,
                  chronumental_date_output=args.chronumental_date_output,
                  chronumental_tree_output=args.chronumental_tree_output,
                  chronumental_reference_node=args.chronumental_reference_node,
                  config_file=args.config_json,
                  title=args.title,
                  overlay_html=args.overlay_html,
                  remove_after_pipe=args.remove_after_pipe,
                  clade_types=args.clade_types,
                  name_internal_nodes=args.name_internal_nodes)


if __name__ == "__main__":
    main()
