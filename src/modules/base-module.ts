import Konva from 'konva';
import { ModuleOptions, EventCallbacks, TextProperties } from '../types/types';
import { DEFAULT_SETTINGS } from '../constants';
import { Notifier } from '@editorjs/editorjs/types/api';

export abstract class BaseModule {
  protected stage: Konva.Stage;
  protected layer: Konva.Layer;
  protected blockId: string;
  protected readOnly: boolean;
  protected onDirty: () => void;
  protected callbacks: EventCallbacks;
  protected notifier: Notifier;

  protected constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    this.stage = options.stage;
    this.layer = options.layer;
    this.blockId = options.blockId;
    this.readOnly = options.readOnly;
    this.onDirty = options.onDirty;
    this.notifier = options.notifier;
    this.callbacks = callbacks;
  }

  protected safeDraw(): void {
    try {
      this.layer?.batchDraw();
    } catch (error) {
      console.error('Error in safeDraw:', error);
    }
  }

  protected isNodeInCurrentEditor(node: Konva.Node | null): boolean {
    if (!node || !this.stage) return false;
    const nodeStage = node.getStage();
    return nodeStage?.container().id === this.stage.container().id;
  }

  protected getDefaultTextProps(): TextProperties {
    return {
      fontSize: DEFAULT_SETTINGS.FONT_SIZE,
      fontFamily: DEFAULT_SETTINGS.FONT,
      fill: DEFAULT_SETTINGS.TEXT_COLOR,
      fontStyle: 'normal',
      width: DEFAULT_SETTINGS.TEXT_WIDTH,
      draggable: DEFAULT_SETTINGS.TEXT_DRAGGABLE,
      align: DEFAULT_SETTINGS.TEXT_ALIGN as 'left' | 'center' | 'right',
      name: DEFAULT_SETTINGS.TEXT_NAME,
      wrap: DEFAULT_SETTINGS.TEXT_WRAP,
      scaleX: DEFAULT_SETTINGS.TEXT_SCALE,
      scaleY: DEFAULT_SETTINGS.TEXT_SCALE,
      lineHeight: DEFAULT_SETTINGS.TEXT_LINE_HEIGHT,
    };
  }

  public destroy(): void {
    // Override in child classes if needed
  }
}
