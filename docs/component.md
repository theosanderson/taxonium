# Taxonium React Component

Taxonium is now available as a React component. There are a few different ways you can use this.

```{eval-rst}
.. note::
    This component is new and in flux.
```

## Basic HTML

```html
<body>
  <div id="root"></div>

  <!-- Include peer dependencies -->
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>

  <!-- Include Taxonium Component -->
  <script src="https://unpkg.com/taxonium-component"></script>

  <script>
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
  </script>

  <script>
    ReactDOM.render(
      React.createElement(Taxonium, { sourceData: sourceData }),
      document.getElementById("root"),
    );
  </script>
</body>
```

## In a React project

### Install Taxonium Component

```
npm install taxonium-component
```

or

```
yarn add taxonium-component
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
