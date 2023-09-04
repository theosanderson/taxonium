import { within, userEvent } from "@storybook/testing-library";
import { useState } from "react";
import Taxonium from "../Taxonium";

const WithState = (args) => {
  const [state, setState] = useState({});
  const updateQuery = (newState) => {
    setState({ ...state, ...newState });
  };
  return (
    <Taxonium
      {...args}
      query={state}
      updateQuery={updateQuery}
      backendUrl={"https://api.cov2tree.org"}
    />
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
