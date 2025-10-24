# Taxonium

[![Published in eLife](https://img.shields.io/badge/Published%20in-eLife-blue.svg)](https://elifesciences.org/articles/82392) <!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-9-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Taxonium is a tool for exploring trees, including those with millions of nodes.

<!--<p align="center"><a href="https://taxonium.org"><img src="https://user-images.githubusercontent.com/19732295/169698808-48204d73-c468-4e80-aff5-876e5df7eab4.png" width=250 /></a></p>-->

### [➡️ Launch Taxonium](https://taxonium.org)

### [📚 Consult the documentation](https://taxonium.readthedocs.io/en/latest/)

### [📝 Read the paper](https://elifesciences.org/articles/82392)

## How do I..

### visualise my own Newick phylogeny?

Upload a Newick file to [Taxonium.org](http://taxonium.org), and optionally a metadata file in CSV or TSV format. If using a metadata file the leftmost column must contain names of the nodes as in the tree.

### explore the global SARS-CoV-2 phylogeny?

Visit [Cov2Tree.org](http://Cov2Tree.org) which uses Taxonium to allow you to explore a tree built by [researchers at UCSC](http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2/) using public data contributed by researchers across the world to the INSDC databases.

### build my own mutation-annotated tree to explore in Taxonium, or add my own metadata to an existing phylogeny?

Use [UShER](https://github.com/yatisht/usher/) to build a mutation-annotated tree. Then use [taxoniumtools](./taxoniumtools/) to convert it to a Taxonium format you can upload to the interface at [Taxonium.org](Taxonium.org)

You can also use taxoniumtools to add your own metadata to [the existing public phylogeny](https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/).

Find out more in [📚 the documentation](https://taxonium.readthedocs.io/en/latest/).

### load really huge trees?

For trees larger than about 6M tips, loading local trees in the browser at Taxonium.org can be unreliable on some systems due to browser memory limitations. To avoid these issues, use the [Taxonium desktop app](https://docs.taxonium.org/en/latest/app.html).

### use Taxonium in my own web application?

Use the [Taxonium component](./taxonium_component).

## See Taxonium in action

- [Cov2Tree](https://cov2tree.org/) - (the repo that runs this is [here](https://github.com/theosanderson/cov2tree))
- [Exploring the NCBI Taxonomy](https://taxonium.org/?treeUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Ftree.nwk.gz&ladderizeTree=true&metaUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fmetadata.tsv.gz&configUrl=https%3A%2F%2Fcov2tree.nyc3.digitaloceanspaces.com%2Fncbi%2Fconfig.json)
- [Serratus](https://serratus.io/trees) (click Tree Viewer on any tree)

## Citing Taxonium

```
Sanderson, T (2022). Taxonium, a web-based tool for exploring large phylogenetic trees. eLife, 11:e82392
https://doi.org/10.7554/eLife.82392
```

N.B. If you are citing the _tree_ displayed at Cov2Tree.org, please cite [the UCSC tree](https://pubmed.ncbi.nlm.nih.gov/34469548/) (.. and ideally Taxonium too if you relied on it for exploration)

There is a separate [paper](https://academic.oup.com/bioinformatics/article/39/1/btac772/6858450) for the Treenome Browser feature (Kramer et al., Bioinformatics, 2022).

## Structure

Taxonium is structured as a 'monorepo' containing a number of components:

- [taxoniumtools](./taxoniumtools/) - a Python package that lets you easily generate Taxonium files from Usher protobuf files
- [taxonium_component](./taxonium_component/) - a React component that implements the Taxonium tree explorer
- [taxonium_website](./taxonium_website/) - The Taxonium website found at [Taxonium.org](https://taxonium.org), a wrapper around taxonium_component
- [taxonium_backend](./taxonium_backend/) - a server-based backend that allows Taxonium trees to be explored without the user downloading the full tree (N.B. Taxonium can also be used without this backend, with static files acccessed in taxonium_website)
- [taxonium_data_handling](./taxonium_data_handling/) - this is a node package upon which both the web client and the backend depend (it handles core logic common to both)

## Contributing

We welcome [contributions](CONTRIBUTING.md). We require that that all contributors follow [the Contributor Covenant Code of Conduct](https://github.com/theosanderson/genomium/blob/main/CODE_OF_CONDUCT.md).

### Contributors

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
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/amkram"><img src="https://avatars.githubusercontent.com/u/6502785?v=4?s=100" width="100px;" alt="Alex Kramer"/><br /><sub><b>Alex Kramer</b></sub></a><br /><a href="https://github.com/theosanderson/taxonium/commits?author=amkram" title="Code">💻</a> <a href="#design-amkram" title="Design">🎨</a> <a href="#ideas-amkram" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://genome.ucsc.edu/"><img src="https://avatars.githubusercontent.com/u/186983?v=4?s=100" width="100px;" alt="Angie Hinrichs"/><br /><sub><b>Angie Hinrichs</b></sub></a><br /><a href="#ideas-AngieHinrichs" title="Ideas, Planning, & Feedback">🤔</a> <a href="#data-AngieHinrichs" title="Data">🔣</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/richardgoater"><img src="https://avatars.githubusercontent.com/u/1429721?v=4?s=100" width="100px;" alt="Richard Goater"/><br /><sub><b>Richard Goater</b></sub></a><br /><a href="#design-richardgoater" title="Design">🎨</a> <a href="https://github.com/theosanderson/taxonium/commits?author=richardgoater" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/chaoran-chen"><img src="https://avatars.githubusercontent.com/u/18666552?v=4?s=100" width="100px;" alt="Chaoran Chen"/><br /><sub><b>Chaoran Chen</b></sub></a><br /><a href="#ideas-chaoran-chen" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/corneliusroemer"><img src="https://avatars.githubusercontent.com/u/25161793?v=4?s=100" width="100px;" alt="Cornelius Roemer"/><br /><sub><b>Cornelius Roemer</b></sub></a><br /><a href="#ideas-corneliusroemer" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/sungyeonkwon"><img src="https://avatars.githubusercontent.com/u/25865179?v=4?s=100" width="100px;" alt="Sung Kwon"/><br /><sub><b>Sung Kwon</b></sub></a><br /><a href="#infra-sungyeonkwon" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://kvargha.com/"><img src="https://avatars.githubusercontent.com/u/35252220?v=4?s=100" width="100px;" alt="Koorous Vargha"/><br /><sub><b>Koorous Vargha</b></sub></a><br /><a href="https://github.com/theosanderson/taxonium/commits?author=kvargha" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/emily-fields"><img src="https://avatars.githubusercontent.com/u/80897288?v=4?s=100" width="100px;" alt="Emily Fields"/><br /><sub><b>Emily Fields</b></sub></a><br /><a href="#ideas-emily-fields" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/theosanderson/taxonium/commits?author=emily-fields" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JosephThorpe"><img src="https://avatars.githubusercontent.com/u/100434056?v=4?s=100" width="100px;" alt="Joe Thorpe"/><br /><sub><b>Joe Thorpe</b></sub></a><br /><a href="https://github.com/theosanderson/taxonium/commits?author=josephthorpe" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

[Alex Kramer](https://corbett-lab.github.io/People/Current/alex/) at UCSC built the _Treenome Browser_ component within Taxonium, described [here](https://www.biorxiv.org/content/10.1101/2022.09.28.509985v1).
