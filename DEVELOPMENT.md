## Install pre-commit hooks

We use [pre-commit.com](https://pre-commit.com/) to run a set of standard pre-commit hooks. You can install these as follows:

```
cd taxonium
pip install pre-commit
pre-commit install
```

## For front-end development

```
cd taxonium_web_client
yarn install
yarn start
```

This should bring up a development server showing Taxonium.


### Linking taxonium_data_handling

A small amount of front-end code comes from the `taxonium_data_handling` repo. If you need to work on this code then link the taxonium data handling repo to the web client repo. (N.B. This seems a bit finicky so do check that changes to `taxonium_data_handling` manifest - if not the most fool-proof approach is to delete `node_modules/taxonium_data_handling` and run `yarn install --check-files`.

```
cd taxonium_data_handling
yarn link
cd ../taxonium_web_client
yarn link taxonium_data_handling
```

## Codespaces

We do a lot of development for the client side version in [GitHub Codespaces](https://github.com/codespaces). There is no reason that you have to do that, but the `devcontainer` set up means you can easily if you so wish.
