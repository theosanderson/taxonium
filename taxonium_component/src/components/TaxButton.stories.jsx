import { fn } from "@storybook/test";
import TaxButton from "./TaxButton";
import { FaSearch, FaCamera, FaHome, FaCog } from "react-icons/fa";

export default {
  title: "Taxonium/TaxButton",
  component: TaxButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const WithIcon = {
  args: {
    onClick: fn(),
    title: "Search",
    children: <FaSearch className="mx-auto w-5 h-5" />,
  },
};

export const WithText = {
  args: {
    onClick: fn(),
    title: "Home Button",
    children: "Home",
  },
};

export const WithIconAndText = {
  args: {
    onClick: fn(),
    title: "Settings",
    children: (
      <>
        <FaCog className="mx-auto w-4 h-4 mb-1" />
        <span className="text-xs">Settings</span>
      </>
    ),
  },
};

// Create a group of buttons to show them in context
export const ButtonGroup = {
  render: () => (
    <div className="flex">
      <TaxButton title="Home" onClick={fn()}>
        <FaHome className="mx-auto w-5 h-5" />
      </TaxButton>
      <TaxButton title="Search" onClick={fn()}>
        <FaSearch className="mx-auto w-5 h-5" />
      </TaxButton>
      <TaxButton title="Camera" onClick={fn()}>
        <FaCamera className="mx-auto w-5 h-5" />
      </TaxButton>
    </div>
  ),
};
