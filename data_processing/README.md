# Data source:

Public data from UCSC and Angie Hinrichs: http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2//


```
wget http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2//public-latest.all.nwk.gz
wget http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2//public-latest.all.masked.vcf.gz
wget http://hgdownload.soe.ucsc.edu/goldenPath/wuhCor1/UShER_SARS-CoV-2//public-latest.metadata.tsv.gz
wget https://raw.githubusercontent.com/nextstrain/ncov-ingest/master/source-data/accessions.tsv
```


# What these scripts do
`python deal_with_vcf.py > out.txt` processes the VCF and writes out a file with mutations (yes it is ridiculous to reimplement this from scratch, sorry.

`python make_files.py` processes all files including `out.txt` and writes out protos in the `../public/` folder. The format is described in [DATA_FORMAT.md](./_DATA_FORMAT.md)
