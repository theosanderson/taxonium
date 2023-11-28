# Advanced topics

#### Permalinks with the Taxonium web interface

You can supply files locally to the Taxonium web interface, or you can supply URLs for the files.

:::{note}
Files must be accessed from a server that allows Cross-Origin Resource Sharing (CORS). We provide a _proxy_ feature which will get files you request and resupply them in a CORS-compatible way. You can untick the _Use Proxy_ box to disable the use of this proxy.
:::

If you supply only remote files, then you will find that the Taxonium.org interface encodes them into its URL as it loads the tree, meaning you can share your tree with other people by copying the Taxonium URL. In addition, any searches or colouring of the tree will also be stored in the URL. Each search will have a permalink button that will create a URL that zooms in on those particular nodes.

#### Custom configuration

There are a number of things you can do customise Taxonium. They all ultimately involve creating a "config" which Taxonium uses to define its behaviour. This config can be specified in several ways, which are listed here in rough order of the priority in which they are applied:

1. As a `config` parameter supplied to the URL containing a JSON string, e.g. `taxonium.org?protoUrl=xxxx&config={"title":"My tree"}`
2. As a `configUrl` supplied to the URL pointing to a JSON file, e.g. https://taxonium.org/?protoUrl=https%3A%2F%2Fmpx-tree.vercel.app%2Fmpx.jsonl.gz&configUrl=https://mpx-tree.vercel.app/config.json
3. As one of several custom parameters to `usher_to_taxonium`, e.g. `--title`,`--overlay_html`.
4. As a `--config_json` file passed to [usher_to_taxonium](taxoniumtools.md).

#### What you can configure

You can configure many things. We only discuss some here. For more information have a look at the [config used for Cov2Tree](https://github.com/theosanderson/taxonium/blob/master/taxonium_backend/config_public.json).

##### Colors

The way that Taxonium handles colurs by default is that they are computed as a hash of the text they represent. That has advantages, because it means that they are consistent over time. But sometimes values of interest can have very similar strings, or may have ugly colours that you wish to change. These can be overwritten using a `colorMapping` object, which maps the string values you want to colors as RGB values. The object looks something like this:

```
{
  "AY.4": [
    255,
    0,
    0
  ],
  "B.1.1.7": [
    0,
    0,
    255
  ]
}
```

We can supply that config in the URL like this:

```
https://taxonium.org/?backend=https://api.cov2tree.org&config={"colorMapping":{"AY.4":[255,0,0],"B.1.1.7":[0,0,255]}}
```

(or just `https://taxonium.org/?config={%22colorMapping%22:{%22AY.4%22:[255,0,0],%22B.1.1.7%22:[0,0,255]}}` and then choose a file of interest)

or make a JSON file containing

```
{"colorMapping":
{"AY.4":[255,0,0],"B.1.1.7":[0,0,255]}
}
```

:::{note}
Guilhem Sempéré has created a tool called [TaxoniumColors](https://webtools.southgreen.fr/TaxoniumColors/) to help with generating these palettes.
:::

##### Title

We can supply a title with the `title` key. It will display at the top.

##### About overlay

You can replace the contents of the "about" section using the `overlay` property, into which you will supply HTML. This can be a bit unwieldy as JSON needs to have no linebreaks in strings (you can use `\n`), so it's easiest to do this in `usher_to_taxonium` by supplying the `overlay_html` parameter which points to an HTML file which will automatically be converted to a compatible format.

#### Deploying your own Taxonium backend

All of the description above involves the full tree being processed wholly locally in your own browser. For very large trees, this can mean a lot of memory and that the initial loading process is quite slow. To solve this issue, you can deploy your own Taxonium backend which will run continually ready to receive traffic and emit a small part of the tree to a client.

This is probably most easily done with our Docker containers (though it is also possible to run without these):

```bash
docker run -p 80:80 -e "DATA_URL=https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master
```

or if you locally have a file at `/path/to/myfile.jsonl.gz`, and want to use up to 12 GB of RAM:

```bash
docker run -p 80:80 -v "/path/to/myfile.jsonl.gz:/mnt/data/myfile.jsonl.gz" -e "DATA_FILE=/mnt/data/myfile.jsonl.gz" -e "CONFIG_JSON=config_public.json" -e "MAXMEM=12000" theosanderson/taxonium_backend:master
```

In either case, that should start a backend on `http://localhost:80`

To connect to the Taxonium backend you can go to `https://taxonium.org?backend=http://localhost:80`. Because Taxonium is served over HTTPS, in some deployments your backend might also need to be served over HTTPS.

```bash
docker run -p 80:80 theosanderson/taxonium_frontend:master
```

For production use you would want to run with Kubernetes or similar to handle automatic restarts.
