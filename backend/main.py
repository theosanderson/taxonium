from email.policy import default
from typing import Optional
from data_processing import taxonium_pb2
from fastapi import FastAPI, HTTPException
import sqlite3
import time
import gzip
import tqdm
import pandas
import numpy as np
from collections import defaultdict
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# disable CORS checks
origins = ["*", "localhost:3000"]

app = FastAPI(title="Taxonium API", openapi_url="/openapi.json")
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

database_loc = "./database/database.feather"

database = pandas.read_feather(database_loc)
database.set_index("node_id", inplace=True)

database['y'] = database['y'] * 20  #* 10000000000
database['x'] = database['x'] * 45  #* 1000 * 2**10
# round x and y to 2dp
database['x'] = database['x'].round(2)
database['y'] = database['y'].round(5)
max_rows = 500e3

import json
#with gzip.open("./database/all_parents.json.gz", "r") as f:
#    all_parents = json.load(f)

#all_parents = {i: set(x) for i, x in all_parents.items()}
all_parents = {}

@app.get("/test/")
def read_test():
    # get row count
    start_time = time.time()
    num_rows = database.shape[0]
    return [num_rows, time.time() - start_time]


def round_and_norm_column(column, minimum, maximum, precision):
    rounded = 2 * (column - minimum) / (maximum - minimum)

    rounded = np.round(rounded, precision)
    return rounded


@app.get("/nodes/")
def read_nodes(
    min_x: float = None,
    max_x: float = None,
    min_y: float = None,
    max_y: float = None,
    type: str = None,
):
    start_time = time.time()
    print("starting")

    filtered = database

    if min_x is not None:
        assert max_x is not None and min_y is not None and max_y is not None
        filtered = filtered[(filtered.x >= min_x) & (filtered.x <= max_x)
                            & (filtered.y >= min_y) & (filtered.y <= max_y)]

    else:
        min_x = filtered.x.min()
        max_x = filtered.x.max()
        min_y = filtered.y.min()
        max_y = filtered.y.max()

    print("pre-rounding time {}".format(time.time() - start_time))

    start_rounding_time = time.time()

    filtered["rounded_x"] = round_and_norm_column(filtered["x"], min_x, max_x,
                                                  4)
    filtered["rounded_y"] = round_and_norm_column(filtered["y"], min_y, max_y,
                                                  4)
    print("rounding time:", time.time() - start_rounding_time)

    # make distinct on combination of rounded_x and rounded_y
    filtered = filtered.drop_duplicates(subset=["rounded_x", "rounded_y"])

    set_of_nodes = set()
    for node_id in filtered.index.values:
        set_of_nodes.add(node_id)
        if node_id in all_parents:
            set_of_nodes.update(all_parents[node_id])

    filtered = database.loc[list(set_of_nodes),
                            ['x', 'y', 'name', 'meta_Lineage', 'parent_id']]

    # get row count
    num_rows = filtered.shape[0]
    print(f"num_rows: {num_rows}")
    if num_rows > max_rows:
        # Return an error from the API
        raise HTTPException(status_code=400,
                            detail=f"Too many rows: {num_rows}")

    # return filtered as dict
    print(f"done filtering bit")

    # Create a pandas df of lines
    lines = filtered

    parent_ids = lines["parent_id"]
    lines['parent_x'] = database.loc[parent_ids, "x"].values
    lines['parent_y'] = database.loc[parent_ids, "y"].values

    print(f"done in {time.time() - start_time}")

    return {
        "leaves": filtered[filtered.name != ""].to_dict(orient="records"),
        "lines": lines.to_dict(orient="records")
    }
