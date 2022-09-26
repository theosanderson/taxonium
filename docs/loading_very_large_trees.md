# Dealing with very large trees

Loading very large trees in Taxonium on some platforms may sometimes require a few tricks. Here we summarise information on this. We are continuing to try to understand the limitations on different platforms.

### Situations that are straightforward

Here we summarise some situations of large trees that load without requring any tweaks:

- Loading [cov2tree](http://cov2tree.org) on almost any platform, which uses the Taxonium backend so that you can explore a tree of >5M sequences without having to download them locally
- Locally loading the [public SARS-CoV-2 tree](https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/) of 5M nodes on ~any platform with at least a few GB of RAM. This will also apply to trees of similar size with similar amount of metadata
- Loading a tree of >11M SARS-CoV-2 sequences (including sequences from GISAID) **in Chrome on Windows**

### Situations that may be more complex

We have observed a memory limitation somewhere between 5M and 11M sequences (dependant also on amount of metadata and mutations) on Chrome for MacOS. This appears to be due to a 2GB memory limit on web worker processes specific to this platform. Using Firefox appears to avoid this issue. **We recommend the use of Firefox if using macOS to view very large trees locally**.

### View taxonium

One way to to view large trees is to use the Taxonium backend. We provide a tool as part of taxoniumtools to help with this. You will need [Docker](https://docs.docker.com/get-docker/), and Python3 and pip.

Get taxoniumtools

```
pip install taxoniumtools
```

Start the servers
```
view_taxonium mytree.jsonl.gz
```

This script will display a URL where you can access Taxonium. It will not have the same memory limits discussed above.

