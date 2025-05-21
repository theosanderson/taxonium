export const formatNumber = (num: number | null): string => {
  return num !== null
    ? num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,")
    : "";
};
