import { fn } from '@storybook/test';
import SearchDisplayToggle from './SearchDisplayToggle';

export default {
  title: 'Taxonium/SearchDisplayToggle',
  component: SearchDisplayToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const DisplayingAsPoints = {
  args: {
    settings: {
      displaySearchesAsPoints: true,
      setDisplaySearchesAsPoints: fn(),
    },
  },
};

export const DisplayingAsCircles = {
  args: {
    settings: {
      displaySearchesAsPoints: false,
      setDisplaySearchesAsPoints: fn(),
    },
  },
};

// Note: The component uses react-hot-toast for notifications
// which may not display properly in Storybook without additional configuration