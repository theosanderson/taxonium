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

### Event Handlers

The Taxonium component now supports event handlers for node interactions:

```jsx
import Taxonium from "taxonium-component";

function App() {
  const handleNodeSelect = (nodeId) => {
    console.log("Node selected:", nodeId);
  };

  const handleNodeDetailsLoaded = (nodeId, nodeDetails) => {
    console.log("Node details loaded:", nodeId, nodeDetails);
  };

  return (
    <Taxonium 
      backendUrl="https://api.cov2tree.org"
      onNodeSelect={handleNodeSelect}
      onNodeDetailsLoaded={handleNodeDetailsLoaded}
    />
  );
}

export default App;
```

#### Available Events

- **`onNodeSelect`**: Fired when a node is clicked in the tree
  - Parameters: `nodeId` (string | number | null) - The ID of the selected node, or null if selection is cleared
  
- **`onNodeDetailsLoaded`**: Fired when details for a selected node have been loaded from the backend
  - Parameters: 
    - `nodeId` (string | number | null) - The ID of the node
    - `nodeDetails` (NodeDetails | null) - The complete node details object containing metadata, mutations, and other information

## Component Props

The Taxonium component accepts the following props:

| Prop | Type | Description |
|------|------|-------------|
| `sourceData` | `SourceData` | Local tree data object with status, filename, filetype, and data |
| `backendUrl` | `string` | URL of the Taxonium backend server |
| `configDict` | `Record<string, unknown>` | Configuration object for customizing the tree |
| `configUrl` | `string` | URL to fetch configuration from |
| `query` | `Query` | Current query/state object |
| `updateQuery` | `(q: Partial<Query>) => void` | Function to update the query state |
| `overlayContent` | `React.ReactNode` | Custom content to overlay on the tree |
| `setAboutEnabled` | `(val: boolean) => void` | Control the about panel visibility |
| `setOverlayContent` | `(content: React.ReactNode) => void` | Dynamically set overlay content |
| `setTitle` | `(title: string) => void` | Set the tree title |
| `onNodeSelect` | `(nodeId: string \| number \| null) => void` | Handle node selection events |
| `onNodeDetailsLoaded` | `(nodeId: string \| number \| null, nodeDetails: NodeDetails \| null) => void` | Handle node details loaded events |

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

