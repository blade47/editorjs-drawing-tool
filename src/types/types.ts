import Konva from 'konva';

export interface KonvaDrawingToolData {
  canvasJson: string | null;
  canvasImages: ImageData[];
  canvasHeight: number;
}

export interface ImageData {
  id: string;
  src: string;
  attrs: {
    x: number;
    y: number;
    width: number;
    height: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
    [key: string]: unknown;
  };
}

export interface ModuleOptions {
  stage: Konva.Stage;
  layer: Konva.Layer;
  blockId: string;
  readOnly: boolean;
  onDirty: () => void;
  config?: ModuleConfig;
}

export interface ModuleConfig {
  guidelines?: boolean;
  snapThreshold?: number;
  maxImageSize?: number;
  defaultFontSize?: number;
  fontFamily?: string;
  textColor?: string;
  backgroundColor?: string;
  [key: string]: unknown;
}

export interface EventCallbacks {
  onSelect?: (node: Konva.Node | null) => void;
  onChange?: () => void;
  onDelete?: () => void;

  onAddText?: () => void;
  onTextPropertyChange?: (props: TextProperties) => void;
  onTextEdit?: (text: Konva.Text) => void;

  onImageUpload?: (event: Event) => void;
  onImageAdd?: (image: Konva.Image) => void;

  onCanvasResize?: (height: number) => void;
  onCanvasSave?: () => void;

  onTransformStart?: (node: Konva.Node) => void;
  onTransformEnd?: (node: Konva.Node) => void;

  onHideTransformer?: () => void;
  onShowTransformer?: () => void;

  onDragStart?: (node: Konva.Node) => void;
  onDragMove?: (node: Konva.Node) => void;
  onDragEnd?: (node: Konva.Node) => void;

  onGuidelineShow?: () => void;
  onGuidelineHide?: () => void;
}

export interface TextProperties {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string | CanvasGradient;
  align?: 'left' | 'center' | 'right';
  fontStyle?: string;
  width?: number;
  height?: number;
  draggable?: boolean;
  name?: string;
  wrap?: string;
  scaleX?: number;
  scaleY?: number;
  x?: number;
  y?: number;
  rotation?: number;
  [key: string]: unknown;
}

export interface ToolbarItem {
  name: string;
  icon: string;
  action: () => void;
  tooltip?: string;
  disabled?: boolean;
}

export interface AlignmentOption {
  value: 'left' | 'center' | 'right';
  icon: string;
}

export interface CanvasSize {
  value: string;
  label: string;
}

export interface GuidelineConfig {
  snapThreshold: number;
  showGuides: boolean;
  guideStrokeStyle: string;
  guideDashArray: number[];
}

export interface TransformerConfig {
  enabledAnchors: string[];
  rotateEnabled: boolean;
  keepRatio: boolean;
  padding?: number;
  boundBoxFunc?: (oldBox: unknown, newBox: unknown) => unknown;
}

export interface HistoryState {
  canvasJson: string;
  canvasImages: ImageData[];
}

export interface HistoryManager {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  push: (state: HistoryState) => void;
}

export interface EditorError extends Error {
  code: string;
  details?: unknown;
}

export interface EditorEventMap {
  'node:select': { node: Konva.Node | null };
  'node:delete': { node: Konva.Node };
  'canvas:save': { data: KonvaDrawingToolData };
  'canvas:change': { isDirty: boolean };
  'image:add': { image: Konva.Image };
  'text:add': { text: Konva.Text };
  error: { error: EditorError };
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type EditorMode = 'edit' | 'view' | 'comment';

export type EditorTheme = 'light' | 'dark' | 'custom';

export interface EditorStyles {
  toolbar?: {
    background?: string;
    borderColor?: string;
    buttonColor?: string;
    buttonHoverColor?: string;
    textColor?: string;
  };
  canvas?: {
    background?: string;
    gridColor?: string;
    guidelineColor?: string;
  };
  [key: string]: unknown;
}

export interface EditorConfig {
  mode?: EditorMode;
  theme?: EditorTheme;
  styles?: EditorStyles;
  modules?: {
    guidelines?: boolean;
    history?: boolean;
    keyboard?: boolean;
    [key: string]: boolean | undefined;
  };
  defaults?: {
    canvasHeight?: number;
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    imageMaxSize?: number;
    [key: string]: unknown;
  };
}

export interface EditorPlugin {
  name: string;
  initialize: (editor: unknown) => void;
  destroy?: () => void;
  [key: string]: unknown;
}

export interface PluginManager {
  register: (plugin: EditorPlugin) => void;
  unregister: (pluginName: string) => void;
  get: (pluginName: string) => EditorPlugin | undefined;
}

export interface ExportOptions {
  format: 'json' | 'png' | 'jpeg' | 'svg';
  quality?: number;
  includeImages?: boolean;
  width?: number;
  height?: number;
}

export interface ImportOptions {
  format: 'json' | 'image';
  replaceExisting?: boolean;
  position?: { x: number; y: number };
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}
