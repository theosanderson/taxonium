# Backend

`nvm use 17.5`

`yarn install`

`node --experimental-fetch server.js --database_dir ./database/ --port 8080 --ssl --config_json config.json`

Non-SSL public:
`node --experimental-fetch server.js --database_dir ./database/ --port 8080 --config_json config_public.json`

GISAID:
`node --experimental-fetch server.js --database_dir /mnt/data/amended_data/ --port 8000 --config_json config_gisaid.json`

then start the dev server for the front-end and go to e.g. http://localhost:3000/?backend=http://localhost:8000

If you need to regenerate the data run `make_pandas.py`:

```
cd data_processing
python3 make_pandas.py
```
