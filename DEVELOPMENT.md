### Install pre-commit hooks

We use [pre-commit.com](https://pre-commit.com/) to run a set of standard pre-commit hooks. You can install these as follows:

```
cd taxonium
pip install pre-commit
pre-commit install
```

## For front-end development

```
cd taxonium_component
npm install
npm run storybook
```

This should bring up a storybook server showing Taxonium.

### Linking taxonium_data_handling

A small amount of front-end code comes from the `taxonium_data_handling` repo. If you need to work on this code then you can "link" the `taxonium_data_handling` to the web client repo.

```
cd taxonium_data_handling
npm install
npm link
cd ../taxonium_component
npm link taxonium_data_handling
```

## For back-end development

```
cd taxonium_backend
npm install
node server.js --data-file tfci.jsonl.gz
```

This will launch the backend server on port 8000, from a small tree file. (Though sometimes this checked in tree file gets out of date in terms of format, you can also use the latest full public tree: `https://cov2tree.nyc3.cdn.digitaloceanspaces.com/latest_public.jsonl.gz` but this will need more RAM).

### Linking taxonium_data_handling

A small amount of backend code comes from the `taxonium_data_handling` repo. If you need to work on this code then you can "link" the `taxonium_data_handling` to the backend repo.

```
cd taxonium_data_handling
npm install
npm link
cd ../taxonium_backend
npm link taxonium_data_handling
```

## Codespaces

We do a lot of development for the client side version in [GitHub Codespaces](https://github.com/codespaces). There is no reason that you have to do that, but the `devcontainer` set up means you can easily if you so wish.
