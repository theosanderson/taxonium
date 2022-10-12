# Using the Taxonium desktop app

Loading very large trees in Taxonium works better in the desktop application. Whereas the Taxonium web app is limited, when loading custom JSONL files, by the browser's memory limitations, the Taxonium desktop app runs a backend which can use much more memory.

You can download the Taxonium desktop app for Windows, MacOS, or Linux from the [releases](https://github.com/theosanderson/taxonium/releases) page.

Once you have downloaded the app, point it to a Taxonium .jsonl or .jsonl.gz file and wait for the backend to load.

You can find an example jsonl file [here](https://github.com/theosanderson/taxonium/blob/master/taxonium_backend/tfci.jsonl?raw=true) (right-click and save-as).

:::{note}
The Taxonium desktop app still requires an internet connection at present, which it uses to load the client.
:::

:::{note}
On some systems, the app may prompt you to allow it to receive incoming connections. This is essential for functionality.
:::


## Creating JSONL files for the Taxonium desktop app

The desktop app at present only supports Taxonium JSONL files. To create JSONL files you can use [usher_to_taxonium](https://docs.taxonium.org/en/latest/taxoniumtools.html#usher-to-taxonium) or [newick_to_taxonium](https://docs.taxonium.org/en/latest/taxoniumtools.html#newick-to-taxonium).


