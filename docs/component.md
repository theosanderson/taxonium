# Taxonium React Component

Taxonium is now available as a React component. There are a few different ways you can use this.

```{eval-rst}
.. note::
    This component is new and in flux.
```

## Basic HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Taxonium Demo</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
    }
    #root {
      width: 100vw;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="module">
    import React from 'https://esm.sh/react@19';
    import { createRoot } from 'https://esm.sh/react-dom@19/client';
    import Taxonium from 'https://esm.sh/taxonium-component';

    const { createElement: h } = React;


    function App() {
      const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

      const metadata_text = `Node,Name,Species
A,Bob,Cow
B,Jim,Cow
C,Joe,Fish
D,John,Fish`;

      // Metadata is optional
      const metadata = {
        filename: "test.csv",
        data: metadata_text,
        status: "loaded",
        filetype: "meta_csv",
      };

      const sourceData = {
        status: "loaded",
        filename: "test.nwk",
        data: nwk,
        filetype: "nwk",
        metadata: metadata,
      };
      
      return h(Taxonium, { sourceData: sourceData });
    }

    const container = document.getElementById('root');
    const root = createRoot(container);
    root.render(h(App));
  </script>
</body>
</html>
```

## In a React project

### Install Taxonium Component

```
npm install taxonium-component
```

### Import and use Taxonium Component in your React jsx

```js
import Taxonium from "taxonium-component";

const App = () => {
  return <Taxonium backendUrl="https://api.cov2tree.org" />;
};
```

## Properties

In either case the following properties are available.

| Property   | Type                  | Default | Description                                                    |
| ---------- | --------------------- | ------- | -------------------------------------------------------------- |
| backendUrl | string                | None    | (Optional) a backend to connect to                             |
| sourceData | Javascript dictionary | None    | (Optional) Tree / metadata to load locally (see section below) |
| configDict | Javascript dictionary | None    | (Optional) configuration (see [advanced](./advanced.md))       |

## sourceData

The `sourceData` property allows you to load a tree and metadata directly into the component.

Examples:

```js
sourceData: {
      status: "url_supplied",
      filename:
        "https://cov2tree.nyc3.cdn.digitaloceanspaces.com/ncbi/special_filtered.jsonl.gz",
      filetype: "jsonl",
}
```

```js
 sourceData: {
      status: "loaded",
      filename: "test.nwk",
      data: `((A:0.1,B:0.2):0.3,C:0.4);`,
      filetype: "nwk",
    }
```

## Building the library

To build the component yourself, run:

```bash
cd taxonium_component
npm install
npm run build
```

The bundles will be written to `taxonium_component/dist`.

## Demo

You can experiment with the component locally via Storybook:

```bash
npm run storybook
```

By default Storybook runs at [http://localhost:6006](http://localhost:6006).

