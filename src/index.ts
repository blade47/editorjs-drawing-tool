import { DrawingTool } from './drawing-tool';
import { IconMarker } from '@codexteam/icons';

export type {
  KonvaDrawingToolData,
  EventCallbacks,
  ModuleOptions,
  TextProperties,
  ImageData,
  ToolbarItem,
  AlignmentOption,
  CanvasSize,
  GuidelineConfig,
  TransformerConfig,
  HistoryState,
  HistoryManager,
  EditorError,
  EditorEventMap,
  DeepPartial,
  EditorMode,
  EditorTheme,
  EditorStyles,
  EditorConfig,
  EditorPlugin,
  PluginManager,
  ExportOptions,
  ImportOptions,
} from './types/types';

export default {
  class: DrawingTool,
  isInline: false,
  toolbox: {
    title: 'Drawing',
    icon: IconMarker,
  },
};
