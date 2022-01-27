Needs fastapi,pyarrow,uvicorn

uvicorn main:app --reload

uvicorn main:app --reload --host 0.0.0.0 --port 8000 --ssl-keyfile=/etc/letsencrypt/live/api.taxonium.org/privkey.pem  --ssl-certfile=/etc/letsencrypt/live/api.taxonium.org/cert.pem 

