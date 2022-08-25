# Taxonium

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-7-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

Taxonium is a tool for exploring trees.

<!--<p align="center"><a href="https://taxonium.org"><img src="https://user-images.githubusercontent.com/19732295/169698808-48204d73-c468-4e80-aff5-876e5df7eab4.png" width=250 /></a></p>-->

### [➡️ Launch Taxonium](https://taxonium.org)

### [📚 Consult the documentation](https://taxonium.readthedocs.io/en/latest/)

### [📝 Read the preprint](https://www.biorxiv.org/content/10.1101/2022.06.03.494608v1)

## How do I..

### visualise my own Newick phylogeny?

Upload a Newick file to [Taxonium.org](http://taxonium.org), and optionally a metadata file in CSV or TSV format. If using a metadata file the leftmost column must contain names of the nodes as in the tree.

### explore the global SARS-CoV-2 phylogeny?

Visit [Cov2Tree.org](http://Cov2Tree.org) which uses Taxonium to allow you to explore a tree built by [researchers at UCSC](http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2/) using public data contributed by researchers across the world to the INSDC databases.

### build my own mutation-annotated tree to explore in Taxonium, or add my own metadata to an existing phylogeny?

Use [UShER](https://github.com/yatisht/usher/) to build a mutation-annotated tree. Then use [taxoniumtools](./taxoniumtools/) to convert it to a Taxonium format you can upload to the interface at [Taxonium.org](Taxonium.org)

You can also use taxoniumtools to add your own metadata to [the existing public phylogeny](https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/).

Find out more in [📚 the documentation](https://taxonium.readthedocs.io/en/latest/).

## See Taxonium in action

- [Cov2Tree](https://cov2tree.org/) - (the repo that runs this is [here](https://github.com/theosanderson/cov2tree))
- [Exploring the NCBI Taxonomy](https://taxonium.org/?treeUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Ftree.nwk.gz&ladderizeTree=true&metaUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fmetadata.tsv.gz&configUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fconfig.json)
- [Serratus](https://serratus.io/trees) (click Tree Viewer on any tree)
- [mpxTree](http://mpxtree.taxonium.org/)

## Citing Taxonium

```
Taxonium: a web-based tool for exploring large phylogenetic trees
Theo Sanderson
bioRxiv 2022.06.03.494608; doi: https://doi.org/10.1101/2022.06.03.494608
```

N.B. If you are citing the _tree_ displayed at Cov2Tree.org, please cite [the UCSC tree](https://pubmed.ncbi.nlm.nih.gov/34469548/) (.. and ideally Taxonium too if you relied on it for exploration)

## Structure

Taxonium consists of a number of components:

- [taxoniumtools](./taxoniumtools/) - a Python package that lets you easily generate Taxonium files from Usher protobuf files
- [taxonium_web_client](./taxonium_web_client/) - the web client that is available at e.g. taxonium.org and let's you explore Taxonium files in your browser
- [taxonium_backend](./taxonium_backend/) - a server-based backend that allows Taxonium trees to be explored without the user downloading the full tree (N.B. Taxonium can also be used without this backend, with static files acccessed in taxonium_web_client)
- [taxonium_data_handling](./taxonium_data_handling/) - this is a node package upon which both the web client and the backend depend (it handles core logic common to both)

## Contributors

Taxonium development was initiated and is led by Theo Sanderson at the Francis Crick Institute.

<table>
  <tr>
    <td align="center"><a href="http://theo.io"><img src="https://avatars.githubusercontent.com/u/19732295?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Theo Sanderson</b></sub></a><br /><a href="https://github.com/theosanderson/taxonium/commits?author=theosanderson" title="Code">💻</a> <a href="https://github.com/theosanderson/taxonium/commits?author=theosanderson" title="Documentation">📖</a> <a href="#design-theosanderson" title="Design">🎨</a> <a href="#ideas-theosanderson" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-theosanderson" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-theosanderson" title="Maintenance">🚧</a></td>
  </tr>
</table>

We are very grateful to our contributors:

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/amkram"><img src="https://avatars.githubusercontent.com/u/6502785?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alex Kramer</b></sub></a><br /><a href="https://github.com/theosanderson/taxonium/commits?author=amkram" title="Code">💻</a> <a href="#design-amkram" title="Design">🎨</a> <a href="#ideas-amkram" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="http://genome.ucsc.edu/"><img src="https://avatars.githubusercontent.com/u/186983?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Angie Hinrichs</b></sub></a><br /><a href="#ideas-AngieHinrichs" title="Ideas, Planning, & Feedback">🤔</a> <a href="#data-AngieHinrichs" title="Data">🔣</a></td>
    <td align="center"><a href="https://github.com/richardgoater"><img src="https://avatars.githubusercontent.com/u/1429721?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Richard Goater</b></sub></a><br /><a href="#design-richardgoater" title="Design">🎨</a> <a href="https://github.com/theosanderson/taxonium/commits?author=richardgoater" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/chaoran-chen"><img src="https://avatars.githubusercontent.com/u/18666552?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Chaoran Chen</b></sub></a><br /><a href="#ideas-chaoran-chen" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/corneliusroemer"><img src="https://avatars.githubusercontent.com/u/25161793?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Cornelius Roemer</b></sub></a><br /><a href="#ideas-corneliusroemer" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/sungyeonkwon"><img src="https://avatars.githubusercontent.com/u/25865179?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sung Kwon</b></sub></a><br /><a href="#infra-sungyeonkwon" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

[Alex Kramer](https://corbett-lab.github.io/People/Current/alex/) at UCSC built the _Treenome Browser_ component within Taxonium which will be described in a forthcoming publication.

<!-- ALL-CONTRIBUTORS-LIST:END -->
