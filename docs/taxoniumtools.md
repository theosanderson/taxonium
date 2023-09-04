# Using TaxoniumTools

#### Installing taxoniumtools

Taxoniumtools is available from PyPI. You can install it with pip.

```bash
pip install taxoniumtools
```

The `usher_to_taxonium`, and `newick_to_taxonium` utilities will then be available for use.

#### Using usher_to_taxonium

##### Example

First get some files:

```bash
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.meta.tsv.gz
wget https://raw.githubusercontent.com/theosanderson/taxonium/master/taxoniumtools/test_data/hu1.gb
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.pb
```

Then convert from UShER pb format to Taxonium jsonl format:

```bash
usher_to_taxonium --input tfci.pb --output tfci-taxonium.jsonl.gz --metadata tfci.meta.tsv.gz --genbank hu1.gb \
--columns genbank_accession,country,date,pangolin_lineage
```

You can then open that `tfci-taxonium.jsonl.gz` file at [taxonium.org](http://taxonium.org)

```{note}
For SARS-CoV-2 we recommend using the exact [modified .gb file we use in the example](https://raw.githubusercontent.com/theosanderson/taxonium/master/taxoniumtools/test_data/hu1.gb), which splits ORF1ab into ORF1a and ORF1b.
```

```{note}
Some people ask what the "L" in JSONL is for. JSONL means "JSON Lines". Each line of the file is a separate JSON object. In the case of Taxonium JSONL format, the very first line contains a lot of metadata about the tree as a whole, and then each additional line contains information about a single node. It's important to use the "jsonl" extension instead of "json" as otherwise the interface may try to parse your tree as a NextStrain JSON file.
```

##### usher_to_taxonium

```{eval-rst}
.. argparse::
   :module: taxoniumtools.src.taxoniumtools.usher_to_taxonium
   :func: get_parser
   :prog: usher_to_taxonium

   This tool will convert an UShER protobuf file into a Taxonium file. At its simplest it just takes the `-i` and `-o` parameters, describing the input and output files. But for the most complete results you can add metadata, a reference genome, or even create a time tree.

   j
      This file controls many aspects of the UI for Taxonium, such as what searches are available. You can see an example file at https://github.com/theosanderson/taxonium/blob/master/taxonium_backend/config_public.json.

   C
      You must have (https://github.com/theosanderson/chronumental) installed to use this (pip install chronumental). Below are several parameters that are only used if Chronumental is called. Refer to the Chronumental documentation for more details
```

Using the parameters above you can trigger `usher_to_taxonium` to launch [Chronumental](https://github.com/theosanderson/chronumental) and create a time tree which will be packaged into your tree.

##### newick_to_taxonium

If you don't need genotype data encoded in the final tree (e.g. some taxonomies, or non-genome-based trees) you can skip UShER and use `newick_to_taxonium`

```{eval-rst}
.. argparse::
   :module: taxoniumtools.src.taxoniumtools.newick_to_taxonium
   :func: get_parser
   :prog: newick_to_taxonium
```
