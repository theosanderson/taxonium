export const formatNumber = (num) => {
  return num !== null
    ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    : "";
};
