# Data source:

Public data from Angie Hinrichs at UCSC: http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2// , her code that produces this is at https://github.com/ucscGenomeBrowser/kent/tree/master/src/hg/utils/otto/sarscov2phylo


```
wget -q -N https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.all.masked.pb
wget  -q -N https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.metadata.tsv.gz
wget  -q -N https://data.nextstrain.org/files/ncov/open/metadata.tsv.gz
wget  -q -N https://github.com/CDCgov/SARS-CoV-2_Sequencing/raw/master/files/epiToPublic.tsv.gz
```

(The NextStrain meta is a temporary solution to fill in missing COG-UK Genbank ids)
