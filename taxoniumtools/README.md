# Taxonium tools

Taxonium tools is a Python utility that allows you to generate Taxonium format files from [UShER](https://usher-wiki.readthedocs.io/en/latest/) mutation-annoated trees.


## Installation

```
pip install taxoniumtools

```


## Usage

First get some files:
```
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.meta.tsv.gz
wget https://raw.githubusercontent.com/theosanderson/taxonium/master/taxoniumtools/test_data/hu1.gb
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.pb
```

```
usher_to_taxonium --input tfci.pb --output tfci-taxonium.jsonl.gz --metadata tfci.meta.tsv.gz --genbank hu1.gb --columns genbank_accession,country,date,pangolin_lineage
```

You can then open that `tfci-taxonium.jsonl.gz` file at [taxonium.org](http://taxonium.org)