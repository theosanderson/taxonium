import classNames from "classnames";
import { ReactNode, MouseEventHandler, ChangeEventHandler } from "react";

export interface ButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
  children?: ReactNode;
  title?: string;
  href?: string;
  target?: string;
}

export interface SelectProps {
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  className?: string;
  children?: ReactNode;
  value?: string | number | readonly string[];
  title?: string;
}

export const Button = ({
  onClick,
  className,
  children,
  title,
  href,
  target,
}: ButtonProps) => {
  if (href && onClick) {
    throw new Error("Button cannot have both href and onClick");
  }
  if (href) {
    return (
      <a
        className={classNames(
          "tx-button no-underline",
          "border border-gray-400 shadow-xs rounded-sm py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700",
          className
        )}
        href={href}
        title={title}
        target={target}
      >
        {children}
      </a>
    );
  } else {
    return (
      <button
        className={classNames(
          "tx-button",
          "border border-gray-400 shadow-xs rounded-sm py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700",
          className
        )}
        onClick={onClick}
        title={title}
      >
        {children}
      </button>
    );
  }
};

export const Select = ({
  onChange,
  className,
  children,
  value,
  title,
}: SelectProps) => {
  return (
    <select
      className={classNames(
        "border bg-white text-gray-900 text-sm hover:text-gray-700 py-1 pl-2 pr-6",
        "focus:ring-gray-800 focus:border-gray-800",
        className
      )}
      onChange={onChange}
      value={value}
      title={title}
    >
      {children}
    </select>
  );
};
