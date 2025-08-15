

## For front-end development

```
cd taxonium_component
npm --prefix ../taxonium_data_handling install && npm install
npm install
npm run storybook
```

This should bring up a storybook server showing Taxonium.

Note: The taxonium_data_handling package needs to be installed first as it's a local dependency.

## For back-end development

```
cd taxonium_backend
npm install
node server.js --data-file tfci.jsonl.gz
```

This will launch the backend server on port 8000, from a small tree file. (Though sometimes this checked in tree file gets out of date in terms of format, you can also use the latest full public tree: `https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz` but this will need more RAM).

### Linking taxonium_data_handling

A small amount of backend code comes from the `taxonium_data_handling` repo. If you need to work on this code then you can link the `taxonium_data_handling` to the backend repo.

```
cd taxonium_data_handling
npm install
npm link
cd ../taxonium_backend
npm link taxonium_data_handling
```

## Codespaces

We do a lot of development for the client side version in [GitHub Codespaces](https://github.com/codespaces). There is no reason that you have to do that, but the `devcontainer` set up means you can easily if you so wish.
