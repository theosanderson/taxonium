from email.policy import default
from typing import Optional
from data_processing import taxonium_pb2
from fastapi import FastAPI, HTTPException, Response
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

g_min_x = database['x'].min()
g_max_x = database['x'].max()
g_min_y = database['y'].min()
g_max_y = database['y'].max()

total_height = database['y'].max() - database['y'].min()
max_rows = 500e3

import json
#with gzip.open("./database/all_parents.json.gz", "r") as f:
#    all_parents = json.load(f)

#all_parents = {i: set(x) for i, x in all_parents.items()}
all_parents = {}


def make_level(database, level):
    database = database.copy()
    exp_level = 2**level
    rounding_level = 4
    database['round_x'] = (database['x'] / exp_level).round(rounding_level)
    database['round_y'] = (database['y'] / exp_level).round(rounding_level)
    uniqued = database.drop_duplicates(subset=['round_x', 'round_y'])
    uniqued.drop(columns=['round_x', 'round_y'], inplace=True)
    # sort by y, permanently
    uniqued.sort_values(by=['y'], inplace=True, ignore_index=True)

    uniqued['parent_x'] = database.loc[uniqued.parent_id, "x"].values
    uniqued['parent_y'] = database.loc[uniqued.parent_id, "y"].values
    return uniqued


levels = {i: make_level(database, i) for i in tqdm.tqdm(range(0, 15))}


def get_level(height):
    most_zoomed_out_level = 11
    difference = height / total_height
    difference_log2 = np.log2(difference)
    level_inc = int(difference_log2)
    level = most_zoomed_out_level + level_inc
    if level < 0:
        level = 0
    if level > most_zoomed_out_level:
        level = most_zoomed_out_level
    return level


@app.get("/test/")
def read_test():
    return Response(content=data, media_type="application/xml")


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

    if min_x is not None:
        assert max_x is not None and min_y is not None and max_y is not None

    else:
        min_x = g_min_x
        max_x = g_max_x
        min_y = g_min_y
        max_y = g_max_y

    height = max_y - min_y
    level_num = get_level(height)
    print(level_num, "level")
    filtered = levels[level_num]
    get_position_of_min_y_by_binary_search = np.searchsorted(filtered.y,
                                                             min_y,
                                                             side='left')
    get_position_of_max_y_by_binary_search = np.searchsorted(filtered.y,
                                                             max_y,
                                                             side='right')
    filtered = filtered.iloc[get_position_of_min_y_by_binary_search:
                             get_position_of_max_y_by_binary_search]

    print("pre-rounding time {}".format(time.time() - start_time))

    start_rounding_time = time.time()

    print("rounding time:", time.time() - start_rounding_time)

    # make distinct on combination of rounded_x and rounded_y

    # get row count
    num_rows = len(filtered)
    print(f"num_rows: {num_rows}")
    if num_rows > max_rows:
        # Return an error from the API
        raise HTTPException(status_code=400,
                            detail=f"Too many rows: {num_rows}")

    # return filtered as dict
    print(f"done filtering bit in {time.time() - start_time}")

    print(f"done parents bit in {time.time() - start_time}")

    leaf_cols = ["x", "y", "meta_Lineage", "name"]
    line_cols = ["x", "y", "parent_x", "parent_y"]
    to_return = '{"leaves":' + filtered[leaf_cols][
        filtered.name != ""].to_json(
            orient='records') + ', "lines":' + filtered[line_cols].to_json(
                orient='records') + '}'

    print("done encoding bit in {}".format(time.time() - start_time))
    return Response(content=to_return, media_type="application/json")
