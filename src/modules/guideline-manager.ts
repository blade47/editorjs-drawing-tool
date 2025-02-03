import Konva from 'konva';
import { BaseModule } from './base-module';
import { DEFAULT_SETTINGS } from '../constants';
import { ModuleOptions, EventCallbacks } from '../types/types';

interface Guide {
  lineGuide: number;
  offset: number;
  orientation: 'V' | 'H';
  snap: 'start' | 'center' | 'end';
}

interface ItemBound {
  guide: number;
  offset: number;
  snap: 'start' | 'center' | 'end';
}

interface GuideResult {
  lineGuide: number;
  diff: number;
  snap: 'start' | 'center' | 'end';
  offset: number;
}

export class GuidelineManager extends BaseModule {
  private guides: Konva.Line[] = [];

  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
  }

  public getLineGuideStops(skipShape: Konva.Node): { vertical: number[]; horizontal: number[] } {
    const vertical = [0, this.stage.width() / 2, this.stage.width()];
    const horizontal = [0, this.stage.height() / 2, this.stage.height()];

    this.stage.find('.object').forEach((guideItem) => {
      if (guideItem === skipShape) {
        return;
      }
      const box = guideItem.getClientRect();

      vertical.push(box.x, box.x + box.width / 2, box.x + box.width);

      horizontal.push(box.y, box.y + box.height / 2, box.y + box.height);
    });

    return {
      vertical: vertical.filter((item, index, array) => array.indexOf(item) === index),
      horizontal: horizontal.filter((item, index, array) => array.indexOf(item) === index),
    };
  }

  private getObjectSnappingEdges(node: Konva.Node): {
    vertical: ItemBound[];
    horizontal: ItemBound[];
  } {
    const box = node.getClientRect();
    const absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: Math.round(box.x),
          offset: Math.round(absPos.x - box.x),
          snap: 'start',
        },
        {
          guide: Math.round(box.x + box.width / 2),
          offset: Math.round(absPos.x - box.x - box.width / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.x + box.width),
          offset: Math.round(absPos.x - box.x - box.width),
          snap: 'end',
        },
      ],
      horizontal: [
        {
          guide: Math.round(box.y),
          offset: Math.round(absPos.y - box.y),
          snap: 'start',
        },
        {
          guide: Math.round(box.y + box.height / 2),
          offset: Math.round(absPos.y - box.y - box.height / 2),
          snap: 'center',
        },
        {
          guide: Math.round(box.y + box.height),
          offset: Math.round(absPos.y - box.y - box.height),
          snap: 'end',
        },
      ],
    };
  }

  private getGuides(
    lineGuideStops: { vertical: number[]; horizontal: number[] },
    itemBounds: ReturnType<typeof this.getObjectSnappingEdges>
  ): Guide[] {
    const resultV: GuideResult[] = [];
    const resultH: GuideResult[] = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < DEFAULT_SETTINGS.GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < DEFAULT_SETTINGS.GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides: Guide[] = [];

    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: 'V',
        snap: minV.snap,
      });
    }

    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: 'H',
        snap: minH.snap,
      });
    }

    return guides;
  }

  public drawGuides(guides: Guide[]): void {
    this.cleanupGuides();

    guides.forEach((lg) => {
      const line = new Konva.Line({
        stroke: 'rgb(0, 161, 255)',
        strokeWidth: 1,
        name: 'guid-line',
        dash: [4, 6],
        listening: false,
      });

      if (lg.orientation === 'H') {
        line.points([-6000, 0, 6000, 0]);
        line.absolutePosition({ x: 0, y: lg.lineGuide });
      } else {
        line.points([0, -6000, 0, 6000]);
        line.absolutePosition({ x: lg.lineGuide, y: 0 });
      }

      this.layer.add(line);
      this.guides.push(line);
    });

    this.layer.batchDraw();
  }

  public cleanupGuides(): void {
    this.guides.forEach((guide) => {
      guide.destroy();
    });
    this.guides = [];

    this.layer.find('.guid-line').forEach((guide) => {
      guide.destroy();
    });

    this.safeDraw();
  }

  public snapToGuides(node: Konva.Node): void {
    if (this.readOnly) return;

    try {
      this.cleanupGuides();

      const lineGuideStops = this.getLineGuideStops(node);
      const itemBounds = this.getObjectSnappingEdges(node);
      const guides = this.getGuides(lineGuideStops, itemBounds);

      if (!guides.length) {
        return;
      }

      this.drawGuides(guides);

      const absPos = node.absolutePosition();
      guides.forEach((lg) => {
        switch (lg.orientation) {
          case 'V':
            absPos.x = lg.lineGuide + lg.offset;
            break;
          case 'H':
            absPos.y = lg.lineGuide + lg.offset;
            break;
        }
      });

      node.absolutePosition(absPos);
    } catch (error) {
      console.error('Error in snapToGuides:', error);
      this.handleDragEnd();
    }
  }

  public handleDragEnd(): void {
    this.cleanupGuides();
    this.callbacks.onChange?.();
  }

  public destroy(): void {
    this.cleanupGuides();
  }

  public hasVisibleGuides(): boolean {
    return this.guides.length > 0;
  }

  public disableGuides(): void {
    this.cleanupGuides();
  }

  public enableGuides(): void {
    // This method doesn't need to do anything actively
    // Guides will be shown on next drag
  }

  public updateGuideStyle(
    style: Partial<{
      color: string;
      strokeWidth: number;
      dash: number[];
    }>
  ): void {
    this.guides.forEach((guide) => {
      guide.setAttrs(style);
    });
    this.layer.batchDraw();
  }
}
