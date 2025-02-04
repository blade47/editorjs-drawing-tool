import { DrawingTool } from './drawing-tool';

export type {
  KonvaDrawingToolData,
  EventCallbacks,
  ModuleOptions,
  TextProperties,
  ImageData,
  ToolbarItem,
  AlignmentOption,
} from './types/types';

export default {
  class: DrawingTool,
  isInline: false,
};
