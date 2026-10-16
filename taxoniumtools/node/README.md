# Node.js usher_to_taxonium

This script converts a UShER protobuf (`.pb` or `.pb.gz`) file to the Taxonium
`jsonl` format. It decodes the protobuf using `protobufjs`, parses the
Newick string with `jstree.js`, and writes out the node table in the
same structure as the Python pipeline.

Install dependencies once with:

```
npm install
```

Run with:

```
node usher_to_taxonium.js <input.pb(.gz)> <metadata.tsv.gz> <genbank.gb> <output.jsonl.gz> [clade_types] [columns]
```
where `clade_types` is an optional comma-separated list like `nextstrain,pango`.
`columns` optionally limits which metadata columns are stored (comma separated,
matching the Python script's `--columns` flag).

Progress bars are displayed while parsing mutations, preparing nodes, and writing the output file so you can track long conversions.
