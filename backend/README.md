# Backend

`nvm use 16`

`npm install`

`node server.js --database_dir ./database/ --port 8080 --ssl --config_json config.json`

(or `node.server.js ssl` if running on my droplet)

then start the dev server for the front-end and go to e.g. http://localhost:3000/?backend=http://localhost:8000

If you need to regenerate the data run `make_pandas.py`:
```
cd data_processing
python3 make_pandas.py
```
