# Treenome Browser

The Treenome Browser allows simultaneous exploration of a reference genome, phylogeny, and the genetic variation within a tree.

#### Getting Started

<iframe width="560" height="315" src="https://user-images.githubusercontent.com/6502785/182259439-0435263f-fa8d-4304-b3a3-b867e0edd175.mp4" frameborder="0" allowfullscreen></iframe>

#### Enabling the Treenome Browser

:::{note}
Currently, only jsonl trees that have been created with `usher_to_taxonium` using a protobuf and an associated Genbank file work with the Treenome Browser. E.g., `usher_to_taxonium -i input.pb -o output.jsonl.gz --genbank gbfile.gb`
:::

If your supplied tree file is supported, enable Treenome Browser in the right-hand panel.

```{image} https://user-images.githubusercontent.com/6502785/182260804-29e238a0-fe18-4e07-8f45-0046ee47a4c3.png
:width: 40em
:class: no-scaled-link
```

#### Navigating the Treenome Browser

To explore the tree, see the main Taxonium [documentation](./index.md)

To explore the genome, click and drag (or scroll) left or right in the top (JBrowse) panel. Zoom into a region by entering coordinates or by dragging across a section of the genome. Hover over mutations to view details.

```{image} https://user-images.githubusercontent.com/6502785/182264410-eb760791-3d16-4162-bc94-1c83515a64fd.png
:width: 30em
:class: no-scaled-link
```

Amino acid mutations are enabled by default. You can also enable nucleotide mutations in the settings menu.

```{image} https://user-images.githubusercontent.com/6502785/182264641-d732e67d-cccd-4186-b40b-3a37a2cecffe.png
:width: 30em
:class: no-scaled-link
```

#### Loading annotations

Load annotations by clicking the track selector button in the browser panel.

```{image} https://user-images.githubusercontent.com/6502785/182264983-c62d6f13-2323-46ba-872a-2db2ac864ca5.png
:width: 20em
:class: no-scaled-link
```

If you are viewing the public SARS-CoV-2 tree ([cov2tree.org](https://cov2tree.org/)), annotation tracks are loaded automatically from the [UCSC Genome Browser](https://genome.ucsc.edu/covid19.html). Otherwise, annotations are currently limited to a reference sequence track.
