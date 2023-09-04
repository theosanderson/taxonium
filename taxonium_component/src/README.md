src/Taxonium.jsx: This is the main entry point for the Taxonium component. It brings together all the hooks and components to render the interactive phylogenetic tree.

src/Deck.jsx: This component renders the actual DeckGL canvas and handles interactions with it. It contains the layers for nodes, lines, labels, etc.

src/hooks: This folder contains all the React hooks used in the project. Some of the main hooks are:

- useBackend: This hook is used to interface with either a local or server backend to get data and search
- useColor, useColorBy: These hooks handle the node coloring logic
- useConfig: This hook is used to get configuration information (title, source, etc)
- useGetDynamicData: This hook is used to get data from the backend within the current viewport
- useLayers: This hook generates the DeckGL layers
- useNodeDetails: This hook is used to get details for selected nodes
- useSearch: This hook handles searching the tree
- useView: This hook manages the view state and zooming/panning
- useHoverDetails: This hook manages hovered node details

src/utils: This folder contains various utility functions, including:

- processNewick.js: For converting Newick/Nexus into Taxonium JSON format
- processNextstrain.js: For converting Nextstrain JSON into Taxonium JSON format
- searchUtil.js: Contains utility functions for searching
- formatNumber.js: Used to format large numbers with commas
