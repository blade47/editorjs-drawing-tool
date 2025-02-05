import Konva from 'konva';
import { BaseModule } from './base-module';
import { ModuleOptions, EventCallbacks } from '../types/types';
import { KEYS } from '../constants';

export class EventManager extends BaseModule {
  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
    this.initializeEvents();
  }

  private initializeEvents(): void {
    if (!this.stage || !this.layer) return;

    if (!this.readOnly) {
      this.attachStageEvents();
      this.attachLayerEvents();
      this.attachWindowEvents();
    } else {
      this.stage.listening(false);
      this.layer.listening(false);
    }
  }

  private attachStageEvents(): void {
    if (this.readOnly) return;

    this.stage.on(
      `click.${this.blockId} tap.${this.blockId}`,
      (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
        if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) return;

        if (e.target === this.stage) {
          this.handleStageClick();
          return;
        }

        this.handleNodeClick(e.target);
      }
    );

    this.stage.on('mouseover touchstart', (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) return;
      document.body.style.cursor = 'pointer';
    });

    this.stage.on('mouseout touchend', () => {
      document.body.style.cursor = 'default';
    });

    this.stage.on('contextmenu', (e: Konva.KonvaEventObject<MouseEvent>) => {
      e.evt.preventDefault();
    });
  }

  private attachLayerEvents(): void {
    if (!this.layer) return;

    this.layer.on('dragstart', (e: Konva.KonvaEventObject<DragEvent>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) {
        e.cancelBubble = true;
        return;
      }
      this.callbacks.onDragStart?.(e.target);
    });

    this.layer.on('dragmove', (e: Konva.KonvaEventObject<DragEvent>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) {
        e.cancelBubble = true;
        return;
      }
      this.callbacks.onDragMove?.(e.target);
    });

    this.layer.on('dragend', (e: Konva.KonvaEventObject<DragEvent>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) {
        e.cancelBubble = true;
        return;
      }
      this.callbacks.onDragEnd?.(e.target);
    });

    this.layer.on('transformstart', (e: Konva.KonvaEventObject<Event>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) return;
      this.callbacks.onTransformStart?.(e.target);
    });

    this.layer.on('transform', (e: Konva.KonvaEventObject<Event>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) return;
      this.callbacks.onChange?.();
    });

    this.layer.on('transformend', (e: Konva.KonvaEventObject<Event>) => {
      if (this.readOnly || !this.isNodeInCurrentEditor(e.target)) return;
      this.callbacks.onTransformEnd?.(e.target);
    });
  }

  private attachWindowEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('paste', this.handlePaste);
  }

  private handleStageClick(): void {
    this.callbacks.onSelect?.(null);
  }

  private handleNodeClick(node: Konva.Node): void {
    if (this.readOnly) return;

    if (node.hasName('guid-line')) return;

    this.callbacks.onSelect?.(node);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.readOnly) return;

    const target = e.target as HTMLElement;
    const isEditingText =
      target.tagName.toLowerCase() === 'textarea' ||
      target.tagName.toLowerCase() === 'input' ||
      target.classList.contains('konva-textarea');

    if (isEditingText) {
      return;
    }

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (e.shiftKey) {
            // Redo
            // Implement redo functionality
          } else {
            // Undo
            // Implement undo functionality
          }
          break;
        case 'c':
          // Copy
          // Implement copy functionality
          break;
        case 'v':
          // Paste
          // Implement paste functionality
          break;
        case 'x':
          // Cut
          // Implement cut functionality
          break;
        case 's':
          // Save
          this.callbacks.onCanvasSave?.();
          break;
      }
    } else {
      switch (e.key) {
        case KEYS.DELETE:
        case KEYS.BACKSPACE:
          if (!isEditingText) {
            this.callbacks.onDelete?.();
          }
          break;
        case KEYS.ESCAPE:
          this.callbacks.onSelect?.(null);
          break;
      }
    }
  };

  private handlePaste = (e: ClipboardEvent): void => {
    if (this.readOnly) return;

    if (e.clipboardData?.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const img = new Image();
              img.onload = () => {
                this.callbacks.onImageAdd?.(
                  new Konva.Image({
                    image: img,
                    draggable: true,
                    name: 'object',
                  })
                );
              };
              img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }
  };

  public destroy(): void {
    this.stage?.off(`click.${this.blockId} tap.${this.blockId}`);
    this.stage?.off('mouseover touchstart');
    this.stage?.off('mouseout touchend');
    this.stage?.off('contextmenu');
    this.layer?.off('dragstart dragmove dragend');
    this.layer?.off('transformstart transform transformend');

    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('paste', this.handlePaste);
  }

  public updateEventListeners(): void {
    this.destroy();
    this.initializeEvents();
  }
}
