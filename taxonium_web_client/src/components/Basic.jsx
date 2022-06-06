import classNames from "classnames";

export const Button = ({ onClick, className, children, title }) => {
  return (
    <button
      className={classNames(
        "tx-button",
        "border border-gray-400 shadow-sm rounded py-1 px-2 bg-gray-100 hover:bg-gray-200 text-sm text-gray-700",
        className
      )}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
};

export const Select = ({ onChange, className, children, value, title }) => {
  return (
    <select
      className={classNames(
        "border bg-white text-gray-900 text-sm hover:text-gray-700 py-1 pl-2 pr-2",
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
