# Advanced topics

#### Permalinks with the Taxonium web interface

You can supply files locally to the Taxonium web interface, or you can supply URLs for the files.

:::{note}
Any files must be uploaded to somewhere that allows Cross-Origin Resource Sharing (CORS).
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

The way that Taxonium handles colurs by default is that they are computed as a hash of the text they represent. That has advantages, because it means that they are consistent over time. But sometimes values of interest can have very similar strings, or may have ugly colours that you wish to change. These can be overwritten using a `colorMapping` object, You need to supply a config, with a `colorMapping` which maps the string values you want to colors as RGB values. The object looks something like this:

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
https://cov2tree.org/?config={"colorMapping":{"AY.4":[255,0,0],"B.1.1.7":[0,0,255]}}
```

or make a JSON file containing

```
{"colorMapping":
{"AY.4":[255,0,0],"B.1.1.7":[0,0,255]}
}
```

##### Title

We can supply a title with the `title` key. It will display at the top.

##### About overlay

You can replace the contents of the "about" section using the `overlay` property, into which you will supply HTML. This can be a bit unwieldy as JSON needs to have no linebreaks in strings (you can use `\n` so it's easiest to do this in `usher_to_taxonium` by supplying the `overlay_html` parameter).

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
