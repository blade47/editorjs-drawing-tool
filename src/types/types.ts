import Konva from 'konva';

export interface KonvaDrawingToolData {
  canvasJson: string | null;
  canvasImages: ImageData[];
  canvasHeight: number;
}

export interface KonvaDrawingToolConfig {
  uploader?: {
    uploadImage?: (base64Image: string) => Promise<string>;
  };
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

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}
