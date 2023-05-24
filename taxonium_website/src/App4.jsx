import { Taxonium } from "taxonium-component";

const App = () => {
  return (
    <div className="App">
      <Taxonium backendUrl="https://api.cov2tree.org" />
    </div>
  );
};

export default App;
