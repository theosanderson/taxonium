# Backend

`nvm use 18`

`yarn install`

`node server.js --data_url https://cov2tree.nyc3.cdn.digitaloceanspaces.com/tfci-taxonium2.jsonl`

`node server.js --database_dir ./database/ --port 8080 --ssl --config_json config.json`

Non-SSL public:
`node server.js --database_dir ./database/ --port 8080 --config_json config_public.json`

GISAID:
`node server.js --database_dir /mnt/data/amended_data/ --port 8000 --config_json config_gisaid.json`

then start the dev server for the front-end and go to e.g. http://localhost:3000/?backend=http://localhost:8000

If you need to regenerate the data run `make_pandas.py`:

## Docker

`docker pull theosanderson/taxonium_backend:master`

`docker run -p 80:80 -e "DATA_URL=https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master`

or download that file and instead run something like:

`docker run -p 80:80 -v "/Users/MyUserName/Desktop:/mnt/data" -e "DATA_FILE=/mnt/data/public-latest.all.masked.taxonium.jsonl.gz" -e "CONFIG_JSON=config_public.json" theosanderson/taxonium_backend:master`

to increase the memory available add `-e "MAXMEM=8000"` for 8 GB.

Deployment on Vultr with SSL. I used: https://www.vultr.com/docs/how-to-deploy-a-next-js-application-with-vultr-kubernetes-engine-and-vultr-load-balancer/#Part_3___Expose_the_Next_js_application_with_secure_SSL_certificates
