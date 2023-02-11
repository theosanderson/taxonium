# Taxonium web client

This is the client used at taxonium.org

### Dev instructions



```
nvm use 18
npm install -g yarn
yarn install
yarn start
```

The above will start a dev server.

Building:

```
yarn build
```

### Serving

There are lots of ways to serve -- once built, this frontend is just a static app.

#### Docker container

We provide a docker container that serves using nginx:

`docker run --pull always -p 80:80 theosanderson/taxonium_frontend:master`
