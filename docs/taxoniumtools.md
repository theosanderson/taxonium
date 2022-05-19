# Using TaxoniumTools

#### Installing taxoniumtools

Taxoniumtools is available from PyPI. You can install it with pip.

```bash
pip install taxoniumtools
```

The `usher_to_taxonium` utility will then be available for use.

#### Using usher_to_taxonium from taxoniumtools

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
Right now Taxoniumtools is limited in the types of genome annotations it can support, for SARS-CoV-2 we recommend using the exact [modified .gb file we use in the example](https://raw.githubusercontent.com/theosanderson/taxonium/master/taxoniumtools/test_data/hu1.gb).
```

##### Full parameters for `usher_to_taxonium`

```{eval-rst}
.. argparse::
   :module: taxoniumtools.src.taxoniumtools.usher_to_taxonium
   :func: get_parser
   :prog: usher_to_taxonium
```

Using the parameters above you can trigger `usher_to_taxonium` to launch [Chronumental](https://github.com/theosanderson/chronumental) and create a time tree which will be packaged into your tree.
