import classNames from "classnames";
export const Button = ({ onClick, className, children, title }) => {
  return (
    <button
      className={classNames(
        "border border-gray-300 rounded p-1 m-3 mb-7 bg-gray-100 hover:bg-gray-200 text-sm",
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
        "border border-gray-300  bg-white text-gray-900 text-sm hover:text-gray-700 p-1 mb-2 ",
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
