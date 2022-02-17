wget -q -N https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.all.masked.pb.gz
wget  -q -N https://hgwdev.gi.ucsc.edu/~angie/UShER_SARS-CoV-2/public-latest.metadata.tsv.gz
# Remove a bad sample
zcat public-latest.metadata.tsv.gz | grep -v OM322554 > public-latest.metadata.tsv
rm public-latest.metadata.tsv.gz
gzip public-latest.metadata.tsv
