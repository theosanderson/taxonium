from email.policy import default
from typing import Optional
from data_processing import taxonium_pb2
from fastapi import FastAPI, HTTPException
import sqlite3
import time
import gzip
import pandas
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
max_rows = 100e3


@app.get("/test/")
def read_test():
    # get row count
    start_time = time.time()
    num_rows = database.shape[0]
    return [num_rows, time.time() - start_time]


@app.get("/nodes/")
def read_nodes(
    min_x: float = None,
    max_x: float = None,
    min_y: float = None,
    max_y: float = None,
    x_precision: float = None,
    y_precision: float = None,
    type: str = None,
):
    start_time = time.time()
    print("starting")

    filtered = database
    if type == "leaves":
        filtered = filtered[filtered.name == ""]
    if min_x is not None:
        filtered = filtered[filtered["x"] >= min_x]
    if max_x is not None:
        filtered = filtered[filtered["x"] <= max_x]
    if min_y is not None:
        filtered = filtered[filtered["y"] >= min_y]
    if max_y is not None:
        filtered = filtered[filtered["y"] <= max_y]

    if x_precision is not None:
        assert y_precision is not None

    if x_precision is not None:
        exponentiated_val = 2**x_precision
        filtered["rounded_x"] = (filtered["x"] *
                                 exponentiated_val).round() / exponentiated_val
        exponentiated_val = 2**y_precision
        filtered["rounded_y"] = (filtered["y"] *
                                 exponentiated_val).round() / exponentiated_val
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

    print(f"done in {time.time() - start_time}")
    # return filtered as dict
    return filtered.to_dict(orient="records")
