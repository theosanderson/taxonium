import { fn } from '@storybook/test';
import { DeckButtons } from './DeckButtons';

export default {
  title: 'Taxonium/DeckButtons',
  component: DeckButtons,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    loading: false,
    setZoomAxis: fn(),
    zoomAxis: 'X',
    snapshot: fn(),
    zoomIncrement: fn(),
    requestOpenSettings: fn(),
    zoomReset: fn(),
    settings: {},
    deckSize: { width: 800, height: 600 },
    triggerSVGdownload: fn(),
  },
};

export const Loading = {
  args: {
    ...Default.args,
    loading: true,
  },
};

export const VerticalZoomAxis = {
  args: {
    ...Default.args,
    zoomAxis: 'Y',
  },
};