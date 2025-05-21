import { fn } from "@storybook/test";
import { Button, Select, ButtonProps, SelectProps } from "./Basic";
import type { ComponentProps } from "react";

export default {
  title: "Taxonium/Basic",
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
};

export const DefaultButton = {
  render: (args: ButtonProps) => <Button {...args}>Click me</Button>,
  args: {
    onClick: fn(),
    title: "Default button",
  },
};

export const ButtonWithClassName = {
  render: (args: ButtonProps) => <Button {...args}>Custom Button</Button>,
  args: {
    onClick: fn(),
    className: "bg-blue-100 hover:bg-blue-200 text-blue-800",
    title: "Button with custom className",
  },
};

export const LinkButton = {
  render: (args: ButtonProps) => <Button {...args}>Link Button</Button>,
  args: {
    href: "https://example.com",
    target: "_blank",
    title: "Button that acts as a link",
  },
};

export const DefaultSelect = {
  render: (args: SelectProps) => (
    <Select {...args}>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ),
  args: {
    onChange: fn(),
    value: "option1",
    title: "Default select dropdown",
  },
};

export const SelectWithClassName = {
  render: (args: SelectProps) => (
    <Select {...args}>
      <option value="option1">Option 1</option>
      <option value="option2">Option 2</option>
      <option value="option3">Option 3</option>
    </Select>
  ),
  args: {
    onChange: fn(),
    value: "option2",
    className: "border-blue-300 focus:ring-blue-500 focus:border-blue-500",
    title: "Select with custom className",
  },
};
