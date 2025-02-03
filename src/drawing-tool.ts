import Konva from 'konva';
import debounce from 'debounce';
import { v4 as uuidv4 } from 'uuid';

import { ToolbarManager } from './modules/toolbar-manager';
import { EventManager } from './modules/event-manager';
import { TextEditor } from './modules/text-editor';
import { ImageHandler } from './modules/image-handler';
import { TransformerManager } from './modules/transformer-manager';
import { GuidelineManager } from './modules/guideline-manager';

import {
  ModuleOptions,
  EventCallbacks,
  KonvaDrawingToolData,
  ImageData,
  TextProperties,
} from './types/types';
import { DEFAULT_SETTINGS } from './constants';
import { API, BlockToolConstructorOptions } from '@editorjs/editorjs';

export class DrawingTool {
  private api: API;
  private wrapper: HTMLDivElement;
  private container: HTMLDivElement;
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;

  private toolbarManager: ToolbarManager | null = null;
  private eventManager: EventManager | null = null;
  private textEditor: TextEditor | null = null;
  private imageHandler: ImageHandler | null = null;
  private transformerManager: TransformerManager | null = null;
  private guidelineManager: GuidelineManager | null = null;

  private selectedNode: Konva.Node | null = null;
  private isDirty: boolean = false;
  private isDestroyed: boolean = false;

  private readonly blockId: string;
  private readonly readOnly: boolean;
  private data: KonvaDrawingToolData;

  private readonly debouncedAutoSave: () => void;
  private readonly AUTO_SAVE_DELAY = 1000;

  static get toolbox() {
    return {
      title: 'Drawing',
      icon: '<svg>...</svg>',
    };
  }

  constructor({ data, readOnly, block, api }: BlockToolConstructorOptions) {
    this.api = api;
    this.blockId = block.id;
    this.readOnly = readOnly || false;
    this.data = this.initializeData(data);
    this.wrapper = this.createWrapper();
    this.container = this.createContainer();
    this.wrapper.appendChild(this.container);

    this.debouncedAutoSave = debounce(this.saveCanvas.bind(this), this.AUTO_SAVE_DELAY);

    setTimeout(() => {
      this.initKonva();
    }, 0);
  }

  public static get isReadOnlySupported(): boolean {
    return true;
  }

  private initializeData(data: KonvaDrawingToolData): KonvaDrawingToolData {
    return {
      canvasJson: data.canvasJson || null,
      canvasImages: Array.isArray(data.canvasImages) ? data.canvasImages : [],
      canvasHeight: data.canvasHeight || DEFAULT_SETTINGS.CANVAS_HEIGHT_PX,
    };
  }

  private createWrapper(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.classList.add('konva-editor-wrapper');
    wrapper.style.width = '100%';
    wrapper.style.position = 'relative';
    if (this.readOnly) {
      wrapper.style.border = 'none';
    } else {
      wrapper.style.border = '1px solid #e0e0e0';
      wrapper.style.borderRadius = '4px';
    }
    return wrapper;
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = `konva-container-${this.blockId}`;
    container.classList.add('konva-editor-container');
    container.style.width = '100%';
    container.style.height = `${this.data.canvasHeight}px`;
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    return container;
  }

  private initKonva(): void {
    try {
      this.stage = new Konva.Stage({
        container: this.container,
        width: this.container.offsetWidth,
        height: parseInt(this.data.canvasHeight.toString(), 10),
      });

      this.layer = new Konva.Layer();
      this.stage.add(this.layer);

      this.initializeModules();
      this.loadCanvas(this.data);

      this.layer.batchDraw();
    } catch (error) {
      console.error('Error initializing Konva:', error);
      throw new Error('Failed to initialize canvas editor');
    }
  }

  private initializeModules(): void {
    if (!this.stage || !this.layer) return;

    const moduleOptions: ModuleOptions = {
      stage: this.stage,
      layer: this.layer,
      blockId: this.blockId,
      readOnly: this.readOnly,
      onDirty: () => this.setDirty(true),
    };

    const callbacks: EventCallbacks = {
      onSelect: (node: Konva.Node | null) => {
        this.handleSelection(node);
      },
      onChange: () => {
        this.setDirty(true);
      },
      onDelete: () => {
        this.deleteNode();
      },

      onAddText: () => {
        this.textEditor?.addText();
      },
      onTextPropertyChange: (props: TextProperties) => {
        this.textEditor?.updateTextProperties(this.selectedNode, props);
      },
      onTextEdit: (text: Konva.Text) => {
        this.textEditor?.createTextEditor(text);
      },

      onImageUpload: (event: Event) => {
        this.imageHandler?.handleImageUpload(event);
      },
      onImageAdd: (image: Konva.Image) => {
        this.addImage(image);
      },

      onCanvasResize: (height: number) => {
        this.resizeCanvas(height);
      },
      onCanvasSave: () => {
        this.saveCanvas();
      },

      onTransformStart: () => {
        this.setDirty(true);
      },
      onTransformEnd: () => {
        this.setDirty(true);
        this.debouncedAutoSave();
      },

      onHideTransformer: () => {
        this.transformerManager?.hideTransformer();
      },
      onShowTransformer: () => {
        this.transformerManager?.showTransformer();
      },

      onDragStart: () => {
        this.guidelineManager?.cleanupGuides();
      },
      onDragMove: (node: Konva.Node) => {
        this.guidelineManager?.snapToGuides(node);
      },
      onDragEnd: () => {
        this.guidelineManager?.cleanupGuides();
        this.setDirty(true);
        this.debouncedAutoSave();
      },
    };

    this.toolbarManager = new ToolbarManager(moduleOptions, callbacks);
    this.eventManager = new EventManager(moduleOptions, callbacks);
    this.textEditor = new TextEditor(moduleOptions, callbacks);
    this.imageHandler = new ImageHandler(moduleOptions, callbacks);
    this.transformerManager = new TransformerManager(moduleOptions, callbacks);
    this.guidelineManager = new GuidelineManager(moduleOptions, callbacks);

    if (!this.readOnly) {
      this.wrapper.insertBefore(this.toolbarManager.createMainToolbar(), this.container);
      this.wrapper.insertBefore(this.toolbarManager.createTextToolbar(), this.container);
    }
  }

  // Canvas Management Methods
  private loadCanvas(data: KonvaDrawingToolData): void {
    try {
      if (!this.layer) return;

      this.layer.destroyChildren();

      if (data.canvasJson) {
        const canvasData = JSON.parse(data.canvasJson);

        const imageLoadPromises = data.canvasImages.map((imageData) => {
          return new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              const konvaImage = new Konva.Image({
                ...imageData.attrs,
                image: img,
                draggable: !this.readOnly,
                name: 'object',
              });
              this.layer?.add(konvaImage);
              resolve();
            };
            img.onerror = reject;
            img.src = imageData.src;
          });
        });

        Promise.all(imageLoadPromises)
          .then(() => {
            canvasData.children.forEach((nodeData: Element) => {
              if (nodeData.className !== 'Image') {
                const node = Konva.Node.create(nodeData);
                if (node instanceof Konva.Text) {
                  this.textEditor.attachDoubleClickHandler(node);
                }
                node.draggable(!this.readOnly);
                this.layer?.add(node);
              }
            });
            this.layer?.batchDraw();
          })
          .catch((error) => {
            console.error('Error loading images:', error);
          });
      }
    } catch (error) {
      console.error('Error loading canvas:', error);
    }
  }

  private async saveCanvas(): Promise<KonvaDrawingToolData> {
    if (!this.layer || !this.isDirty) {
      return this.data;
    }

    try {
      this.guidelineManager?.cleanupGuides();

      const canvasJson = this.layer.toJSON();

      const canvasImages: ImageData[] = [];
      this.layer.find('Image').forEach((imageNode: Konva.Image) => {
        const imageElement = imageNode.image() as HTMLImageElement;
        if (imageElement) {
          canvasImages.push({
            id: imageNode.id() || uuidv4(),
            src: imageElement.src,
            attrs: imageNode.attrs,
          });
        }
      });

      this.data = {
        ...this.data,
        canvasJson,
        canvasImages,
      };

      this.setDirty(false);
      return this.data;
    } catch (error) {
      console.error('Error saving canvas:', error);
      throw new Error('Failed to save canvas state');
    }
  }

  private handleSelection(node: Konva.Node | null): void {
    if (this.readOnly) return;

    try {
      if (this.selectedNode && (!node || node !== this.selectedNode)) {
        this.transformerManager?.clearTransformer();
      }

      this.selectedNode = node;

      if (node && this.isNodeInCurrentEditor(node)) {
        this.transformerManager?.createTransformerForNode(node);
        this.toolbarManager?.updateToolbarState(node);
      } else {
        this.transformerManager?.clearTransformer();
        this.toolbarManager?.updateToolbarState(null);
      }
    } catch (error) {
      console.error('Error handling selection:', error);
    }
  }

  private deleteNode(): void {
    if (this.readOnly || !this.isNodeInCurrentEditor(this.selectedNode)) return;

    try {
      if (this.selectedNode instanceof Konva.Image) {
        const imageId = this.selectedNode.id();
        if (imageId) {
          this.data.canvasImages = this.data.canvasImages.filter((img) => img.id !== imageId);
        }

        const img = this.selectedNode.image() as HTMLImageElement;
        if (img) {
          img.src = '';
          this.selectedNode.clearCache();
        }
      }

      this.transformerManager?.clearTransformer();

      this.selectedNode.destroy();
      this.selectedNode = null;

      this.toolbarManager?.updateToolbarState(null);
      this.layer?.batchDraw();

      this.setDirty(true);
      this.debouncedAutoSave();
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  }

  private addImage(image: Konva.Image): void {
    if (this.readOnly) return;

    try {
      image.draggable(true);
      image.name('object');
      image.id(uuidv4());

      this.layer?.add(image);

      this.handleSelection(image);

      this.setDirty(true);
      this.debouncedAutoSave();
    } catch (error) {
      console.error('Error adding image:', error);
    }
  }

  private resizeCanvas(height: number): void {
    if (!this.stage || !this.container) return;

    try {
      this.container.style.height = `${height}px`;
      this.stage.height(height);
      this.data.canvasHeight = height;

      this.setDirty(true);
      this.debouncedAutoSave();
    } catch (error) {
      console.error('Error resizing canvas:', error);
    }
  }

  private setDirty(isDirty: boolean): void {
    this.isDirty = isDirty;
    this.toolbarManager?.updateSaveIndicator(isDirty);
  }

  private isNodeInCurrentEditor(node: Konva.Node): boolean {
    return node && node.getStage()?.container().id === this.container.id;
  }

  public render(): HTMLElement {
    return this.wrapper;
  }

  public save(): Promise<KonvaDrawingToolData> {
    return this.saveCanvas();
  }

  public validate(data: KonvaDrawingToolData): boolean {
    try {
      if (data.canvasJson) {
        JSON.parse(data.canvasJson);
      }
      return true;
    } catch (error) {
      console.debug(error);
      return false;
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return;

    try {
      if (this.isDirty) {
        this.saveCanvas();
      }

      this.eventManager?.destroy();
      this.toolbarManager?.destroy();
      this.guidelineManager?.destroy();
      this.transformerManager?.destroy();
      this.textEditor?.destroy();
      this.imageHandler?.destroy();

      this.layer?.destroy();
      this.stage?.destroy();

      this.wrapper.remove();

      this.stage = null;
      this.layer = null;
      this.selectedNode = null;

      this.isDestroyed = true;
    } catch (error) {
      console.error('Error destroying editor:', error);
    }
  }
}
