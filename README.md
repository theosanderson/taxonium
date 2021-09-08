# Taxodium

Taxodium is a client-side Javascript tool for exploring extremely large trees. It is currently used for Cov2Tree, a display of the global SARS-CoV-2 phylogeny: 🌳 http://cov2tree.org 

The data and tree displayed in Cov2Tree are collated by the UShER team: http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2// . The sequences contained represent the work of thousands of researchers across the world.

Most of this repository is a client side React app that displays the tree. It loads the `public/nodelist.pb` file, which contains a pre-processed form of the data. The Python scripts that build this file are in `data_processing`, along with a little documentation.

## Using it for your own data

You can now generate Taxodium format files from [UShER](https://github.com/yatisht/usher/pull/134).


Right now you would need to create your own `data_processing` directory, which is adapted to produce the `nodelist.pb` file from your own datasets. We will try to streamline this. Feel free to raise an Issue requesting help!



## Development instructions
```
nvm use 14
yarn install
yarn start
```
