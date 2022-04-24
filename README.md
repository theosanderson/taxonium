# Taxonium

Taxonium is a tool for exploring extremely large trees. It is currently used for Cov2Tree, a display of the global SARS-CoV-2 phylogeny: 🌳 http://cov2tree.org

The data and tree displayed in Cov2Tree are collated by the UShER team: http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2// . The sequences contained represent the work of thousands of researchers across the world.


## Structure

Taxonium now consists of a number of components:
* [taxoniumtools](./taxoniumtools/) - a Python package that lets you easily generate Taxonium files from Usher protobuf files
* [taxonium_web_client](./taxonium_web_client/) - the web client that is available at e.g. taxonium.org and let's you explore Taxonium files in your browser
* [taxonium_backend](./taxonium_backend/) - a server-based backend that allows Taxonium trees to be explored without the user downloading the full tree (N.B. Taxonium can also be used without this backend, with static files acccessed in taxonium_web_client)
* [taxonium_data_handling](./taxonium_data_handling/) - this is a node package upon which both the web client and the backend depend (it handles core logic common to both)
