// The browser worker installs an accelerator after feature detection. Server-side
// users and browsers without Memory64 keep the same JavaScript implementation.
let accelerator = null;

export const getAccelerator = () => accelerator;
export const setAccelerator = (value) => {
  accelerator = value;
};
