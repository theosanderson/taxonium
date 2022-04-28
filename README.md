# Taxonium

Taxonium is a tool for exploring extremely large trees. It is currently used for Cov2Tree, a display of the global SARS-CoV-2 phylogeny: 🌳 http://cov2tree.org

## How do I..

### explore the global SARS-CoV-2 phylogeny?

Visit [Cov2Tree.org](http://Cov2Tree.org) which uses Taxonium to allow you to explore a tree built by researchers at UCSC using public data contributed by researchers across the world to the INSDC databases.

### build my own phylogeny to explore in Taxonium, or add my own metadata to an existing phylogeny?

Use [UShER](https://github.com/yatisht/usher/) to build a mutation-annotated tree. Then use [taxoniumtools](./taxoniumtools/) to convert it to a Taxonium format you can upload to the interface at [Taxonium.org](Taxonium.org)

You can also use taxoniumtools to add your own metadata to the existing public phylogeny.

## Structure

Taxonium now consists of a number of components:

- [taxoniumtools](./taxoniumtools/) - a Python package that lets you easily generate Taxonium files from Usher protobuf files
- [taxonium_web_client](./taxonium_web_client/) - the web client that is available at e.g. taxonium.org and let's you explore Taxonium files in your browser
- [taxonium_backend](./taxonium_backend/) - a server-based backend that allows Taxonium trees to be explored without the user downloading the full tree (N.B. Taxonium can also be used without this backend, with static files acccessed in taxonium_web_client)
- [taxonium_data_handling](./taxonium_data_handling/) - this is a node package upon which both the web client and the backend depend (it handles core logic common to both)
