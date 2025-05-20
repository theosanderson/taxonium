import { fn } from "@storybook/test";
import { TreenomeButtons, TreenomeButtonsProps } from "./TreenomeButtons";

export default {
  title: "Taxonium/TreenomeButtons",
  component: TreenomeButtons,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const Default = {
  args: {
    loading: false,
    requestOpenSettings: fn(),
    settings: {},
  },
};

export const Loading = {
  args: {
    loading: true,
    requestOpenSettings: fn(),
    settings: {},
  },
};

export const WithFunctionalHandlers = {
  args: {
    loading: false,
    requestOpenSettings: () => {
      alert("Settings dialog would open here (simulated in Storybook)");
    },
    settings: {},
  },
};

// Add a container to see the absolute positioning in action
export const WithContainer = {
  render: (args: TreenomeButtonsProps) => (
    <div className="relative border border-gray-300 w-96 h-64">
      <TreenomeButtons {...args} />
    </div>
  ),
  args: {
    loading: false,
    requestOpenSettings: fn(),
    settings: {},
  },
};
