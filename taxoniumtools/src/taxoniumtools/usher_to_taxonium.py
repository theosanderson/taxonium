#python usher_to_taxonium.py --input public-latest.all.masked.pb.gz --output ../taxonium_web_client/public/public2.jsonl.gz --metadata public-latest.metadata.tsv.gz --genbank hu1.gb --columns genbank_accession,country,date,pangolin_lineage

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
                  chronumental_reference_node=None,
                  config_file=None):

    metadata_dict, metadata_cols = utils.read_metadata(metadata_file, columns)

    if config_file is not None:
        config = json.load(open(config_file))
    else:
        config = {}

    if "gz" in input_file:
        f = gzip.open(input_file, 'rb')
    else:
        f = open(input_file, 'rb')

    mat = ushertools.UsherMutationAnnotatedTree(f, genbank_file)
    f.close()

    if chronumental_enabled:
        utils.do_chronumental(
            mat=mat,
            chronumental_reference_node=chronumental_reference_node,
            metadata_file=metadata_file,
            chronumental_steps=chronumental_steps,
            chronumental_date_output=chronumental_date_output)

    print("Ladderizing tree..")
    mat.tree.ladderize(ascending=False)
    print("Ladderizing done")
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
        "config": config
    }

    node_to_index = {node: i for i, node in enumerate(nodes_sorted_by_y)}

    if "gz" in output_file:
        output_file = gzip.open(output_file, 'wt')
    else:
        output_file = open(output_file, 'wt')
    output_file.write(json.dumps(first_json, separators=(',', ':')) + "\n")
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
        output_file.write(
            json.dumps(node_object, separators=(',', ':')) + "\n")
    output_file.close()

    print(
        f"Done. Output written to {output_file}, with {len(nodes_sorted_by_y)} nodes."
    )


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
    parser.add_argument(
        "--chronumental_date_output",
        type=str,
        help="Output file for the chronumental date file, if any")

    parser.add_argument("--chronumental_reference_node",
                        type=str,
                        help="Taxonium reference node",
                        default=None)
    parser.add_argument("--config_json",
                        type=str,
                        help="A JSON file to use as a config file",
                        default=None)

    args = parser.parse_args()
    do_processing(args.input,
                  args.output,
                  metadata_file=args.metadata,
                  genbank_file=args.genbank,
                  chronumental_enabled=args.chronumental,
                  chronumental_steps=args.chronumental_steps,
                  columns=args.columns,
                  chronumental_date_output=args.chronumental_date_output,
                  chronumental_reference_node=args.chronumental_reference_node,
                  config_file=args.config_json)


if __name__ == "__main__":
    main()
