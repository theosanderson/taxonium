import taxonium_pb2
import sqlite3
import gzip
import tqdm

protobuf_location = "./nodelist.pb.gz"

# Read in the protobuf file
with gzip.open(protobuf_location, "rb") as f:
    nodelist = taxonium_pb2.AllData()
    nodelist.ParseFromString(f.read())

# Create a new SQLite database with columns:
# id, x, y, name, parent_id, num_tips
# there should also be one column per item in nodelist.node_data.metadata_singles

conn = sqlite3.connect("../database/database.db")
c = conn.cursor()

metadata_single_names = [
    f"{metadata_single.metadata_name}"
    for metadata_single in nodelist.node_data.metadata_singles
]

extra_column_names = [f"meta_{name}" for name in metadata_single_names]

extra_columns_defs = [f"{name} INTEGER" for name in extra_column_names]

# DROP table if exists
c.execute("DROP TABLE IF EXISTS nodes")

sql_create_table = f"""
CREATE TABLE nodes (
    node_id INTEGER PRIMARY KEY,
    x REAL,
    y REAL,
    parent_id INTEGER,
    num_tips INTEGER,
    name TEXT,
    {", ".join(extra_columns_defs)}
);
"""

c.execute(sql_create_table)

meta_mappings = {}
meta_lists = {}
for metadata_single in nodelist.node_data.metadata_singles:
    meta_mappings[metadata_single.metadata_name] = metadata_single.mapping
    meta_lists[metadata_single.metadata_name] = metadata_single.node_values

for id, x in tqdm.tqdm(enumerate(nodelist.node_data.x)):
    y = nodelist.node_data.y[id]
    parent_id = nodelist.node_data.parents[id]
    num_tips = nodelist.node_data.num_tips[id]
    name = nodelist.node_data.names[id]
    extra_columns = [meta_lists[name][id] for name in metadata_single_names]
    sql = f"""INSERT INTO nodes (node_id, name, x, y, parent_id, num_tips, {", ".join(extra_column_names)})
    VALUES ({id}, '{name}', {x}, {y}, {parent_id}, {num_tips}, {", ".join([str(x) for x in extra_columns])})"""
    #print(sql)
    c.execute(sql)

# For both x and y create a series of rounded values, with column names x_precision_1, x_precision_2, etc.
for type in "xy":
    for precision in tqdm.tqdm(range(1, 11), desc="Creating precisions"):
        column_name = f"{type}_precision_{precision}"
        sql = f"""ALTER TABLE nodes ADD COLUMN {column_name} INTEGER"""
        c.execute(sql)
        exp_precision = 2**precision
        sql = f"""UPDATE nodes SET {column_name} = round(x * {exp_precision})"""
        c.execute(sql)
        # Also make an index
        sql = f"""CREATE INDEX {column_name}_index ON nodes ({column_name})"""

sql = """ DROP TABLE IF EXISTS node_to_mutation """
c.execute(sql)

sql = """
CREATE TABLE node_to_mutation (
    node_id INTEGER,
    mutation_id INTEGER
);
"""
c.execute(sql)

# Create mutations table from nodelist.mutation_mapping
sql = """ DROP TABLE IF EXISTS mutations """
c.execute(sql)

sql = """
CREATE TABLE mutations (
    mutation_id INTEGER PRIMARY KEY,
    gene TEXT,
    residue_pos INTEGER,
    previous_residue CHAR,
    new_residue CHAR
    );"""
c.execute(sql)

for mutation_id, name in enumerate(nodelist.mutation_mapping):
    try:
        gene, rest = name.split(":")
        previous_residue, residue_pos, new_residue = rest.split("_")
        sql = f"""INSERT INTO mutations (mutation_id, gene, residue_pos, previous_residue, new_residue)
        VALUES ({mutation_id}, '{gene}', {residue_pos}, '{previous_residue}', '{new_residue}')"""
        c.execute(sql)
    except ValueError:
        print(f"Error with mutation {name}")

# Create a mapping table for each extra_column_names
for name in metadata_single_names:
    table_name = f"meta_{name}"
    sql = f""" DROP TABLE IF EXISTS {table_name} """
    c.execute(sql)

    sql = f"""
    CREATE TABLE {table_name} (
        id INTEGER,
        value TEXT 
    );"""
    c.execute(sql)

    for id, value in enumerate(meta_mappings[name]):
        sql = f"""INSERT INTO {table_name} (id, value)
        VALUES ({id}, '{value}')"""
        c.execute(sql)

# Save (commit) the changes
conn.commit()
