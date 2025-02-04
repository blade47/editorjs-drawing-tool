import debounce from 'debounce';
import { BaseModule } from './base-module';
import { EventCallbacks, ModuleOptions } from '../types/types';
import { DEFAULT_SETTINGS } from '../constants';

export class ResponsiveStageManager extends BaseModule {
  private readonly RESIZE_DEBOUNCE_TIME = 10;
  private readonly originalWidth: number;
  private canvasHeight: number;

  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
    this.originalWidth = DEFAULT_SETTINGS.CANVAS_WIDTH_PX;

    this.initializeResizeHandler();
  }

  public setCanvasHeight(height: number): void {
    this.canvasHeight = height;
    this.handleResize();
  }

  private initializeResizeHandler(): void {
    window.addEventListener(
      'resize',
      debounce(() => this.handleResize(), this.RESIZE_DEBOUNCE_TIME)
    );
  }

  private handleResize(): void {
    if (!this.stage || !this.layer) return;

    const container = this.stage.container();
    if (!container) return;

    try {
      this.setListening(false);

      const containerWidth = container.offsetWidth;
      const scale = containerWidth / this.originalWidth;

      this.stage.width(this.originalWidth);
      this.stage.height(this.canvasHeight);

      this.stage.scale({ x: scale, y: scale });

      container.style.height = `${this.canvasHeight * scale}px`;

      this.stage.size({
        width: containerWidth,
        height: this.canvasHeight * scale,
      });

      this.layer.batchDraw();
    } catch (error) {
      console.error('Error during resize:', error);
    } finally {
      setTimeout(() => {
        this.setListening(true);
      }, 100);
    }
  }

  private setListening(enabled: boolean): void {
    this.layer?.getChildren().forEach((node) => {
      node.setAttr('listening', enabled);
    });
  }

  public getCurrentScale(): number {
    if (!this.stage?.container()) return 1;
    return this.stage.container().offsetWidth / this.originalWidth;
  }

  public toOriginalPosition(x: number, y: number): { x: number; y: number } {
    const scale = this.getCurrentScale();
    return {
      x: x / scale,
      y: y / scale,
    };
  }

  public toScaledPosition(x: number, y: number): { x: number; y: number } {
    const scale = this.getCurrentScale();
    return {
      x: x * scale,
      y: y * scale,
    };
  }

  public destroy(): void {
    window.removeEventListener('resize', this.handleResize);
  }
}
