import React, { useState, useEffect, useRef } from "react";

interface DebounceInputProps {
  value: string | number;
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  debounceTime?: number;
  className?: string;
  placeholder?: string;
  type?: string;
  element?: "input" | "textarea";
  [key: string]: unknown;
}

const DebounceInput = ({
  value,
  onChange,
  debounceTime = 300,
  className = "",
  placeholder = "",
  type = "text",
  element = "input",
  ...props
}: DebounceInputProps) => {
  // Internal state to track the input value
  const [inputValue, setInputValue] = useState(value);

  // Keep a reference to the latest onChange callback
  const onChangeRef = useRef(onChange);

  // Update the ref when onChange changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Update internal value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Set up the debounce effect
  useEffect(() => {
    // Skip the initial render
    if (inputValue === value) return;

    // Create timeout for debounce
    const handler = setTimeout(() => {
      // Create a synthetic event that mimics a native onChange event
      const event = {
        target: { value: inputValue } as EventTarget & HTMLInputElement,
        preventDefault: () => {},
        stopPropagation: () => {},
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Call the onChange handler with our synthetic event
      onChangeRef.current(event);
    }, debounceTime);

    // Cleanup the timeout when component unmounts or inputValue changes
    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, debounceTime, value]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInputValue(e.target.value);
  };

  if (element === "textarea") {
    return (
      <textarea
        value={inputValue}
        onChange={handleChange}
        className={className}
        placeholder={placeholder}
        {...props}
      />
    );
  }

  return (
    <input
      type={type}
      value={inputValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};

export default DebounceInput;
