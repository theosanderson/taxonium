# Taxonium tools

Taxonium tools is a Python utility that allows you to generate Taxonium format files from [UShER](https://usher-wiki.readthedocs.io/en/latest/) mutation-annoated trees.

## Installation

### Python Version
```
pip install taxoniumtools
```



## Usage

### Basic run

First get some files:

```
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.meta.tsv.gz
wget https://raw.githubusercontent.com/theosanderson/taxonium/master/taxoniumtools/test_data/hu1.gb
wget https://github.com/theosanderson/taxonium/raw/master/taxoniumtools/test_data/tfci.pb
```

Then convert from UShER pb format to Taxonium jsonl format:

```
usher_to_taxonium --input tfci.pb --output tfci-taxonium.jsonl.gz --metadata tfci.meta.tsv.gz --genbank hu1.gb \
--columns genbank_accession,country,date,pangolin_lineage
```

You can then open that `tfci-taxonium.jsonl.gz` file at [taxonium.org](http://taxonium.org)

### Use Chronumental to infer a time tree

Taxonium tools can also use [Chronumental](https://github.com/theosanderson/chronumental) to infer a time tree for the phylogeny.

```
pip install chronumental
```

```
usher_to_taxonium --input tfci.pb --output tfci-taxonium.jsonl.gz --metadata tfci.meta.tsv.gz --genbank hu1.gb \
--columns genbank_accession,country,date,pangolin_lineage --chronumental --chronumental_steps 300
```

## Performance Comparison

| Implementation | Speed | Memory | GenBank Support | Metadata Support |
|----------------|-------|--------|----------------|------------------|
| **C++** | 0.14s | 27 MB | ✅ | ✅ |
| **Python** | 2.03s | 172 MB | ✅ | ✅ |
| **Improvement** | **14.5x faster** | **6.4x less memory** | Same accuracy | Same features |

For production workflows or large datasets, the C++ implementation provides dramatic performance benefits while maintaining identical output format and biological accuracy.

### For more information see the [docs](https://docs.taxonium.org/en/latest/taxoniumtools.html)
