import Konva from 'konva';
import { BaseModule } from './base-module';
import { MIN_DIMENSIONS } from '../constants';
import { EventCallbacks, ModuleOptions } from '../types/types';

export class TransformerManager extends BaseModule {
  private transformer: Konva.Transformer | null = null;

  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
    this.initializeTransformer();
  }

  private initializeTransformer(): void {
    if (!this.layer) return;

    try {
      if (this.transformer) {
        this.transformer.destroy();
        this.transformer = null;
      }

      this.transformer = new Konva.Transformer();

      this.layer.add(this.transformer);
      this.layer.batchDraw();
    } catch (error) {
      console.error('Error initializing transformer:', error);
    }
  }

  public createTransformerForNode(node: Konva.Node): void {
    if (!this.transformer || !this.layer || !node) {
      console.warn('Transformer, layer, or node is not initialized');
      return;
    }

    try {
      this.transformer.nodes([]);
      this.transformer.detach();

      const config = this.getTransformerConfig(node);

      this.transformer.destroy();
      this.transformer = new Konva.Transformer(config);
      this.layer.add(this.transformer);

      this.transformer.setZIndex(node.getZIndex());

      this.transformer.nodes([node]);

      if (node instanceof Konva.Text) {
        this.attachTextTransformHandler(node);
      } else if (node instanceof Konva.Image) {
        this.attachImageTransformHandler(node);
      } else {
        this.attachDefaultTransformHandler(node);
      }

      this.layer.batchDraw();
    } catch (error) {
      console.error('Error creating transformer for node:', error);
    }
  }

  private getTransformerConfig(node: Konva.Node): object {
    if (node instanceof Konva.Text) {
      return {
        enabledAnchors: ['middle-left', 'middle-right'],
        rotateEnabled: false,
        keepRatio: false,
        padding: 5,
        boundBoxFunc: (oldBox: { width: number }, newBox: { width: number }) => {
          return newBox.width < MIN_DIMENSIONS.WIDTH ? oldBox : newBox;
        },
      };
    } else if (node instanceof Konva.Image) {
      return {
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        rotateEnabled: true,
        keepRatio: true,
        padding: 5,
        borderStroke: '#00ff00',
        anchorStroke: '#00ff00',
        anchorFill: '#ffffff',
        boundBoxFunc: (
          oldBox: { width: number; height: number },
          newBox: { width: number; height: number }
        ) => {
          return newBox.width < MIN_DIMENSIONS.WIDTH || newBox.height < MIN_DIMENSIONS.HEIGHT
            ? oldBox
            : newBox;
        },
      };
    } else {
      return {
        enabledAnchors: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
        rotateEnabled: true,
        keepRatio: false,
        padding: 5,
        borderStroke: '#0000ff',
        anchorStroke: '#0000ff',
        anchorFill: '#ffffff',
      };
    }
  }

  private attachTextTransformHandler(textNode: Konva.Text): void {
    textNode.off('transform');
    textNode.on('transform', () => {
      const newWidth = Math.max(MIN_DIMENSIONS.WIDTH, textNode.width() * textNode.scaleX());
      textNode.setAttrs({
        width: newWidth,
        scaleX: 1,
        scaleY: 1,
      });
      this.safeDraw();
    });

    textNode.on('transformend', () => {
      this.callbacks.onTransformEnd?.(textNode);
    });
  }

  private attachImageTransformHandler(imageNode: Konva.Image): void {
    imageNode.off('transform transformend');

    imageNode.on('transform', () => {
      const scaleX = imageNode.scaleX();
      const scaleY = imageNode.scaleY();

      const width = Math.max(MIN_DIMENSIONS.WIDTH, imageNode.width() * scaleX);
      const height = Math.max(MIN_DIMENSIONS.HEIGHT, imageNode.height() * scaleY);

      imageNode.setAttrs({
        width: width,
        height: height,
        scaleX: 1,
        scaleY: 1,
      });

      this.safeDraw();
    });

    imageNode.on('transformend', () => {
      this.callbacks.onTransformEnd?.(imageNode);
    });
  }

  private attachDefaultTransformHandler(node: Konva.Node): void {
    node.off('transform transformend');

    node.on('transform', () => {
      // Handle general transformation
      // Add specific logic here if needed
      this.safeDraw();
    });

    node.on('transformend', () => {
      this.callbacks.onTransformEnd?.(node);
    });
  }

  public clearTransformer(): void {
    if (!this.transformer || !this.layer) return;

    try {
      this.transformer.nodes([]);
      this.transformer.detach();
      this.layer.batchDraw();
    } catch (error) {
      console.error('Error clearing transformer:', error);
    }
  }

  public hideTransformer(): void {
    if (this.transformer) {
      this.transformer.hide();
      this.layer.batchDraw();
    }
  }

  public showTransformer(): void {
    if (this.transformer) {
      this.transformer.show();
      this.transformer.forceUpdate();
      this.layer.batchDraw();
    }
  }

  public destroy(): void {
    if (this.transformer) {
      try {
        this.transformer.destroy();
      } catch (error) {
        console.error('Error destroying transformer:', error);
      }
      this.transformer = null;
    }
  }
}
