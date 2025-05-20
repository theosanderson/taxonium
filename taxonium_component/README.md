# Taxonium Component

`taxonium-component` provides the tree viewer used by [Taxonium](https://taxonium.org) as a reusable React component.

## Installation

Install the package from npm:

```bash
npm install taxonium-component
```

## Embedding in a React application

```jsx
import Taxonium from "taxonium-component";

function App() {
  return <Taxonium backendUrl="https://api.cov2tree.org" />;
}

export default App;
```

## Using script tags

```html
<div id="root"></div>

<!-- Peer dependencies -->
<script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>

<!-- Taxonium component -->
<script src="https://unpkg.com/taxonium-component"></script>
<script>
  const sourceData = {
    status: "loaded",
    filename: "test.nwk",
    data: "((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);",
    filetype: "nwk",
  };
  ReactDOM.render(
    React.createElement(Taxonium, { sourceData }),
    document.getElementById("root")
  );
</script>
```

## Building the library

To build the component from source:

```bash
cd taxonium_component
npm install
npm run build
```

The compiled files will appear in the `dist` directory.

## Demo

A Storybook demo can be started locally with:

```bash
npm run storybook
```

This will launch an example at [http://localhost:6006](http://localhost:6006).

