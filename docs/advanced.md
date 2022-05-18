
# Advanced topics

#### Permalinks with the Taxonium web interface

You can supply files locally to the Taxonium web interface, or you can supply URLs for the files.

:::{note}
Any files must be uploaded to somewhere that allows Cross-Origin Resource Sharing (CORS).
:::

If you supply only remote files, then you will find that the Taxonium.org interface encodes them into its URL as it loads the tree, meaning you can share your tree with other people by copying the Taxonium URL. In addition, any searches or colouring of the tree will also be stored in the URL. Each search will have a permalink button that will create a URL that zooms in on those particular nodes.

#### Deploying your own Taxonium backend

All of the description above involves the full tree being processed wholly locally in your own browser. For very large trees, this can mean a lot of memory and that the initial loading process is quite slow. To solve this issue, you can deploy your own Taxonium backend which will run continually in some cloud server, ready to receive traffic and emit a small part of the tree to a client.

This is probably most easily done with our Docker containers (though it is also possible to run without these):

```bash
docker run -p 8000:80 -e "DATA_URL=https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master
```

or

```bash
docker run -p 8000:80 -v myfile.jsonl.gz:/data/myfile.jsonl.gz -v myconfig.json:/data/myconfig.json -e "DATA_FILE=/data/myfile.jsonl.gz" -e "CONFIG_JSON=/data/myconfig.json" theosanderson/taxonium_backend:master
```

That should start a backend on `http://localhost:80`

To connect to the Taxonium backend you can go to `https://taxonium.org?backend=[your backend URL here with no trailing slash]`. Because Taxonium is served over HTTPS, your backend would also need to served over HTTPS, meaning a proxy that provides an HTTPS connection.

Alternatively, you could host your own version of the Taxonium front end not via HTTPS (this also may be useful inside firewalled public health institutions.)

```bash
docker run -p 80:80 theosanderson/taxonium_frontend:master
```
