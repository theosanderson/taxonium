#!/bin/bash
mkdir -p binaries
wget https://cov2tree.nyc3.cdn.digitaloceanspaces.com/node_binaries/node18_arm64mac -O binaries/node18_arm64mac -q
wget https://cov2tree.nyc3.cdn.digitaloceanspaces.com/node_binaries/node18_x64mac -O binaries/node18_x64mac -q
wget https://cov2tree.nyc3.cdn.digitaloceanspaces.com/node_binaries/node18.exe -O binaries/node18.exe -q
wget https://cov2tree.nyc3.cdn.digitaloceanspaces.com/node_binaries/node18_x64linux -O binaries/node18_x64linux -q
chmod +x binaries/*