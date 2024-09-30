# Using the Taxonium desktop app

Loading very large (>5M tips) trees in Taxonium works better in the desktop application. Whereas the Taxonium web app is limited when loading custom JSONL files by the browser's memory limitations, the Taxonium desktop app runs a backend which can use much more memory to load larger trees and run more smoothly.

<img width="864" alt="image" src="https://user-images.githubusercontent.com/19732295/195406844-b46525cf-bd70-49b5-a413-cd8e5ce88259.png">

### Installing

You can download the Taxonium desktop app for Windows, MacOS, or Linux from the [releases](https://github.com/theosanderson/taxonium/releases) page.

:::{note}
On MacOS you will need to "unquarantine" the app, because the code has not been signed. Before you do this, the application will claim that it is "damaged and can't be opened".

Please use the terminal command below to achieve this:

```
sudo /usr/bin/xattr -r -d com.apple.quarantine "/Applications/Taxonium.app"
```

(if Taxonium is stored at that location)

This may give a message `xattr: No such file: /Applications/Taxonium.app/Contents/Resources/app/node_modules/macos-alias/build/node_gyp_bins/python3` but that is not a problem

:::

### Using the app

Once you have downloaded the app, point it to a Taxonium .jsonl or .jsonl.gz file and wait for the backend to load.

You can find a small example jsonl file [here](https://github.com/theosanderson/taxonium/blob/master/taxonium_backend/tfci.jsonl?raw=true) (right-click and save-as), or download the large Cov2Tree tree [here](https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz) (which is based on the UCSC public tree).

:::{note}
The Taxonium desktop app still requires an internet connection at present, which it uses to load the client.
:::

:::{note}
On some systems, the app may prompt you to allow it to receive incoming connections. This is essential for functionality.
:::

## Creating JSONL files for the Taxonium desktop app

The desktop app at present only supports Taxonium JSONL files. To create JSONL files you can use [usher_to_taxonium](https://docs.taxonium.org/en/latest/taxoniumtools.html#usher-to-taxonium) or [newick_to_taxonium](https://docs.taxonium.org/en/latest/taxoniumtools.html#newick-to-taxonium).

(Remember that you can visualise Newick / Nexus files with <5M sequences directly with the [web app](https://taxonium.org/))
