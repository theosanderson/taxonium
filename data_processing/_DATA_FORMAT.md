# Data format
## Encoding
To minimise bandwidth usage, and file size (we currently host the data files on GitHub!), we store all the data needed to display the tree in protocol-buffer (protobuf) format.

We also use a slightly complex structure that minimises storage, and also minimises RAM usage on the client's machine.

### Top level: AllData
The top level data is stored in a message of type AllData, this contains:

1. node_data: this is the data for each individual node, in a single AllNodeData message (should rename that), and is described below
4. mutation_mapping: a list of unique mutations, used to encode the mutations for node_data.
5. date_mapping: as above, but with string dates



### node_data

Here we store all the data for the individual nodes. We do this in a series of lists, for efficiency. Each of these lists has an entry for every node (including internal nodes without metadata). The nodes each have an implicit numeric identifier (the order in the list).

1. names: list of strings for sequence names 
2. x: list of floats for x position
3. y: list of floats for y position
4. countries: list of ints, which are entries in the country_mapping lookup table
5. lineages: list of ints, which are entries in the lineage_mapping lookup table
6. mutations: list of MutationList objects (see below) one for each node
7. dates: list of ints, which are entries in the date_mapping lookup table
8. parents: list of ints which are the numeric identifiers (i.e. positions in these lists) of each node's parental node
9. genbanks: list of string for genbank identifiers
10. epi_isl_numbers (unused at present)
11. num_tips: number of tips beneath each node
12. metadata_singles: set of MetadataSingleValuePerNode objects, described below

### MetadataSingleValuePerNode objects

1.  metadata_name: string name of the metadata, e.g. "Country"
2.  metadata_title: more decorative title, but this is currently unused..
3. mapping: a list of strings, in an order. This creates a mapping from the strings index to its value
4. node_values: a value for each node in the tree, in the same order as sequence names above. The value should be given as the index of the matching value in the mapping

### mutations
Here we have a list of ints for each node, representing mutations which can be looked up in the table.

### How I should improve this 
Create generic protos for metadata objects:
- one-to-many strings with mapping table

Then write JS to be able to deal with this arbitrary set.
