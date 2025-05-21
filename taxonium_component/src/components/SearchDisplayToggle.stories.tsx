import { fn } from "@storybook/test";
import SearchDisplayToggle from "./SearchDisplayToggle";
import type { Settings } from "../types/settings";

export default {
  title: "Taxonium/SearchDisplayToggle",
  component: SearchDisplayToggle,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const DisplayingAsPoints = {
  args: {
    settings: {
      displaySearchesAsPoints: true,
      setDisplaySearchesAsPoints: fn(),
    } as unknown as Settings,
  },
};

export const DisplayingAsCircles = {
  args: {
    settings: {
      displaySearchesAsPoints: false,
      setDisplaySearchesAsPoints: fn(),
    } as unknown as Settings,
  },
};

// Note: The component uses react-hot-toast for notifications
// which may not display properly in Storybook without additional configuration
