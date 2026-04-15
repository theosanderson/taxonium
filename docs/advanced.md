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

###### Default coloring behaviour

By default, Taxonium chooses a color for each value as follows:

- **String values** are hashed and the hash is converted to an RGB color. This has the advantage that colors stay consistent over time without needing to be stored anywhere.
- **Numeric values** are mapped onto the [plasma](https://bids.github.io/colormap/) perceptual colormap using a log10-scaled, 0–1 clamped value.
- **Amino acid single-letter codes** (A, R, N, D, C, Q, E, G, H, I, L, K, M, F, P, T, W, Y, V, X, O, Z) are mapped to a fixed, readable palette. This is used when coloring by genotype.
- A number of **specific strings** have hard-coded colors (e.g. `USA`, `England`, `France`, `OXFORD_NANOPORE`, `user-provided`, …). These give recognisable defaults for common SARS-CoV-2 metadata values.
- Missing / placeholder values (`undefined`, `""`, `unknown`, `None`, `N/A`, `NA`) are shown in gray.

All of the options below let you override or extend these defaults.

###### Choosing which field to color by (`defaultColorByField` and `colorBy.colorByOptions`)

The field that Taxonium colors by when the tree first loads can be set with the `defaultColorByField` config key. The dropdown of available "Color by" fields is controlled by `colorBy.colorByOptions` — an array of field names that will be offered to the user:

```json
{
  "defaultColorByField": "meta_pango_lineage_usher",
  "colorBy": {
    "colorByOptions": [
      "meta_pango_lineage_usher",
      "meta_country",
      "genotype",
      "None"
    ]
  }
}
```

The special value `"genotype"` enables coloring by the amino acid (or nucleotide) at a specific position, and `"None"` disables coloring.

###### The `color` URL parameter

The current coloring is stored in the URL as a JSON-encoded `color` parameter so that it can be shared via permalinks. It accepts three keys:

- `field` — the metadata field to color by (matching one of the `colorByOptions`, or `"genotype"`).
- `gene` — when `field` is `"genotype"`, the gene to use (e.g. `"S"`, or `"nt"` for nucleotide).
- `pos` — when `field` is `"genotype"`, the residue (or nucleotide) position.

For example, to color by the amino acid at spike position 484:

```
https://taxonium.org/?backend=https://api.cov2tree.org&color={"field":"genotype","gene":"S","pos":484}
```

###### Categorical overrides (`colorMapping`)

Hash-based colors are consistent, but sometimes values of interest have very similar strings, or may have ugly colours that you wish to change. These can be overwritten using a `colorMapping` object, which maps the string values you want to colors as RGB values. The object looks something like this:

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

You can also adjust individual colors interactively by clicking a swatch in the color legend and picking a new color from the color picker.

:::{note}
Guilhem Sempéré has created a tool called [TaxoniumColors](https://webtools.southgreen.fr/TaxoniumColors/) to help with generating these palettes.
:::

###### Continuous color scales (`colorRamps`)

For numeric fields you can specify a continuous gradient scale using `colorRamps`. Each entry is keyed by the field name and contains a `scale` — a list of `[value, color]` stops that are linearly interpolated between. Values outside the domain are clamped, and non-numeric values fall back to gray.

```json
{
  "colorRamps": {
    "meta_mouse_escape": {
      "scale": [
        [0,   "#000000"],
        [1,   "#cccccc"],
        [1.5, "#ffee00"],
        [2,   "#ff0000"]
      ]
    }
  }
}
```

When a field with a `colorRamp` is selected, the color legend renders a gradient key rather than a list of discrete values. `colorRamps` takes precedence over the default numeric plasma scale and over any `colorMapping` entries for that field.

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
