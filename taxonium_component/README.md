# Taxonium component

This React component is the heart of Taxonium.

See the [dcumentation on the component](https://docs.taxonium.org/en/latest/component.html)


## Basics

Set up the source data:
```

const nwk = `((A:0.1,B:0.2):0.3,(C:0.4,D:0.5):0.6);`;

const metadata_text = 
`Node,Name,Species
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

```

In React, 

```
import Taxonium from 'taxonium-component';

const App = () => {
  return (
    <Taxonium sourceData={sourceData} />
  );
};
```

In basic HTML, 

```
<body>
  <div id="root"></div>

  <!-- Include peer dependencies -->
  <script src="https://unpkg.com/react@17/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@17/umd/react-dom.production.min.js"></script>

  <!-- Include Taxonium Component -->
  <script src="https://unpkg.com/taxonium-component@2.100.0/dist/taxonium-component.umd.js"></script>

  <script>
    const MyComponent = TaxoniumComponent.Taxonium;

    ReactDOM.render(
      React.createElement(MyComponent, { sourceData: sourceData}),
      document.getElementById('root')
    );
  </script>
</body>
```




### Developing the package

```
yarn install
yarn storybook
```