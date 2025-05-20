import { useState } from "react";
import Taxonium from "../Taxonium";

const WithState = (args: any) => {
  const [state, setState] = useState({});
  const updateQuery = (newState: any) => {
    setState({ ...state, ...newState });
  };
  return (
    <div style={{ width: "100%", height: "500px" }}>
      <Taxonium
        {...args}
        query={state}
        updateQuery={updateQuery}
        backendUrl={"https://api.cov2tree.org"}
      />
    </div>
  );
};

export default {
  title: "Example/Page2",
  component: WithState,
};

export const WithBackend = {
  args: {
    backendUrl: "https://api.cov2tree.org",
  },

  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/react/configure/story-layout
    layout: "padded",
  },
};
