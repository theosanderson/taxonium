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

# disable CORS checks
origins = ["*", "localhost:3000"]

app = FastAPI(title="Taxonium API", openapi_url="/openapi.json")

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
# check index is unique

database['y'] = database['y'] * 20  #* 10000000000
database['x'] = database['x'] * 45  #* 1000 * 2**10
max_rows = 200e3


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

    if min_x is None:
        min_x = filtered['x'].min()
    else:
        filtered = filtered[filtered['x'] >= min_x]
    if max_x is None:
        max_x = filtered['x'].max()
    else:
        filtered = filtered[filtered['x'] <= max_x]
    if min_y is None:
        min_y = filtered['y'].min()
    else:
        filtered = filtered[filtered['y'] >= min_y]
    if max_y is None:
        max_y = filtered['y'].max()
    else:
        filtered = filtered[filtered['y'] <= max_y]

    filtered["rounded_x"] = round_and_norm_column(filtered["x"], min_x, max_x,
                                                  3)
    filtered["rounded_y"] = round_and_norm_column(filtered["y"], min_y, max_y,
                                                  3)

    # make distinct on combination of rounded_x and rounded_y
    filtered = filtered.drop_duplicates(subset=["rounded_x", "rounded_y"])
    filtered = filtered.drop(columns=["rounded_x", "rounded_y"])

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
