import taxonium_pb2
import gzip
import tqdm
import pandas as pd
import json

protobuf_location = "../../public/nodelist.pb.gz"
print("Reading proto")

# Read in the protobuf file
with gzip.open(protobuf_location, "rb") as f:
    nodelist = taxonium_pb2.AllData()
    nodelist.ParseFromString(f.read())

print("Done reading proto")

for_df = {
    "node_id": range(len(nodelist.node_data.x)),
    "x": list(nodelist.node_data.x),
    "y": list(nodelist.node_data.y),
    "parent_id": list(nodelist.node_data.parents),
    "num_tips": list(nodelist.node_data.num_tips),
    "name": list(nodelist.node_data.names),
}

for metadata_single in nodelist.node_data.metadata_singles:
    for_df[f"meta_{metadata_single.metadata_name}"] = [
        metadata_single.mapping[x] for x in metadata_single.node_values
    ]

print("Creating dataframe")
df = pd.DataFrame(for_df)
# set the meta columns to categorical
for name in df.columns:
    if name.startswith("meta_"):
        df[name] = df[name].astype("category")
print("Done creating dataframe")

print(df)

df = df.sort_values(by=["y"])
df.reset_index(inplace=True)
# reset index and create mapping from old index to new index
old_node_ids = df.node_id.values.tolist()
df['node_id'] = list(range(len(nodelist.node_data.x)))
old_to_new = dict(zip(old_node_ids, df.node_id.values))
df['parent_id'] = df.parent_id.apply(lambda x: old_to_new[int(x)])


# also save as jsonl
df.to_json("../database/database.jsonl.gz", orient="records", lines=True)


print("saved")


mutation_ids = []
previous_residues = []
residue_poses = []
new_residues = []
genes = []

for mutation_id, name in enumerate(nodelist.mutation_mapping):
    if name == "":
        continue
    gene, rest = name.split(":")
    previous_residue, residue_pos, new_residue = rest.split("_")
    previous_residues.append(previous_residue)
    residue_poses.append(residue_pos)
    new_residues.append(new_residue)
    mutation_ids.append(mutation_id)
    genes.append(gene)

mutation_table = pd.DataFrame({
    "mutation_id": mutation_ids,
    "previous_residue": previous_residues,
    "residue_pos": residue_poses,
    "new_residue": new_residues,
    "gene": genes
})

mutation_table.to_json("../database/mutation_table.jsonl.gz", orient="records", lines=True)



# set gene and residues to categorical
mutation_table["gene"] = mutation_table["gene"].astype("category")
mutation_table["previous_residue"] = mutation_table["previous_residue"].astype(
    "category")
mutation_table["new_residue"] = mutation_table["new_residue"].astype(
    "category")



node_ids = []
mutation_ids = []
for node_id, these_mutation_ids in enumerate(nodelist.node_data.mutations):
    for mutation_id in these_mutation_ids.mutation:
        node_ids.append(node_id)
        mutation_ids.append(mutation_id)

node_to_mut = pd.DataFrame({"node_id": node_ids, "mutation_id": mutation_ids})
node_to_mut['node_id'] = node_to_mut.node_id.apply(lambda x: old_to_new[x])
grouped = node_to_mut.sort_values(by=["node_id"]).groupby("node_id")
output_list = [ [] for x in range(len(nodelist.node_data.x))]
for name, group in grouped:
    output_list[name] = group.mutation_id.values.tolist()

output_file = "../database/node_to_mut.json.gz"
with gzip.open(output_file, "wt") as f:
    json.dump(output_list, f)



