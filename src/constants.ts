export const DEFAULT_SETTINGS = {
  FONT_SIZE: 16,
  FONT: 'Open Sans, sans-serif',
  TEXT_COLOR: '#000000',
  TEXT_WIDTH: 150,
  TEXT_ALIGN: 'left',
  TEXT_WRAP: 'word',
  TEXT_DRAGGABLE: true,
  TEXT_NAME: 'object',
  TEXT_SCALE: 1,
  TEXT_LINE_HEIGHT: 1.6,
  CANVAS_HEIGHT_PX: 500,
  CANVAS_WIDTH_PX: 1050,
  TEXTAREA_PADDING: 5,
  IMAGE_SCALE_FACTOR: 0.8,
  GUIDELINE_OFFSET: 5,
  AUTO_SAVE_DELAY: 1000,
  LINK_COLOR: '#0066cc',
  LINK_TEXT_DECORATION: 'underline',
} as const;

export const KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
} as const;

export const CANVAS_SIZES = [
  { label: 'Small (250px)', value: '250' },
  { label: 'Medium (500px)', value: '500' },
  { label: 'Large (700px)', value: '700' },
  { label: 'xLarge (900px)', value: '900' },
] as const;

export const MIN_DIMENSIONS = {
  WIDTH: 20,
  HEIGHT: 20,
} as const;
