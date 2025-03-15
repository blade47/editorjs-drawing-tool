import Konva from 'konva';
import { BaseModule } from './base-module';
import { DEFAULT_SETTINGS, KEYS } from '../constants';
import { TextProperties, ModuleOptions, EventCallbacks, Position } from '../types/types';

export class TextEditor extends BaseModule {
  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
  }

  public addText(): void {
    if (this.readOnly) return;

    const text = new Konva.Text({
      x: this.stage.width() / 2 - 100,
      y: this.stage.height() / 2 - 10,
      text: 'Click to edit',
      ...this.getDefaultTextProps(),
      id: `text-${this.blockId}-${Date.now()}`,
      draggable: !this.readOnly,
    });

    this.attachDoubleClickHandler(text);
    this.attachClickHandler(text);

    this.layer.add(text);
    this.callbacks.onSelect?.(text);
    this.safeDraw();
    this.onDirty();
  }

  public createTextEditor(textNode: Konva.Text): void {
    if (this.readOnly) return;

    const existingTextarea = document.querySelector('.konva-textarea');
    if (existingTextarea) {
      existingTextarea.parentNode?.removeChild(existingTextarea);
    }

    const linkUrl = textNode.getAttr('link');

    textNode.hide();
    this.callbacks.onHideTransformer?.();

    const textarea = this.createTextarea(textNode);
    this.setupTextareaEvents(textarea, textNode, {
      onFinish: () => {
        if (linkUrl) {
          textNode.setAttr('link', linkUrl);
          textNode.setAttr('textDecoration', DEFAULT_SETTINGS.LINK_TEXT_DECORATION);
          textNode.fill(DEFAULT_SETTINGS.LINK_COLOR);
        }
      },
    });
  }

  public attachDoubleClickHandler(textNode: Konva.Text): void {
    textNode.off('dblclick dbltap');

    textNode.on('dblclick dbltap', () => {
      this.createTextEditor(textNode);
    });
  }

  public attachClickHandler(textNode: Konva.Text): void {
    textNode.off('click tap');

    textNode.on('click tap', (e) => {
      const link = textNode.getAttr('link');
      if (link && (this.readOnly || e.evt.ctrlKey || e.evt.metaKey)) {
        window.open(link, '_blank', 'noopener,noreferrer');
        e.cancelBubble = true;
      }
    });

    textNode.off('mouseover mouseout');

    textNode.on('mouseover', () => {
      if (textNode.getAttr('link')) {
        this.stage.container().style.cursor = 'pointer';
      }
    });

    textNode.on('mouseout', () => {
      this.stage.container().style.cursor = 'default';
    });
  }

  private createTextarea(textNode: Konva.Text): HTMLTextAreaElement {
    const position = this.calculateTextareaPosition(textNode);
    const textarea = document.createElement('textarea');

    textarea.classList.add('konva-textarea');
    textarea.setAttribute('data-editor-id', this.blockId);
    textarea.value = textNode.text();

    document.body.appendChild(textarea);
    this.applyTextareaStyles(textarea, textNode, position);
    textarea.focus();

    return textarea;
  }

  private calculateTextareaPosition(textNode: Konva.Text): Position {
    const stageBox = this.stage.container().getBoundingClientRect();
    const textPosition = textNode.absolutePosition();
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    return {
      x: stageBox.left + textPosition.x + scrollX,
      y: stageBox.top + textPosition.y + scrollY,
    };
  }

  private applyTextareaStyles(
    textarea: HTMLTextAreaElement,
    textNode: Konva.Text,
    position: Position
  ): void {
    const styles = {
      position: 'absolute',
      top: `${position.y}px`,
      left: `${position.x}px`,
      width: `${textNode.width() - textNode.padding() * 2}px`,
      height: `${textNode.height() - textNode.padding() * 2 + DEFAULT_SETTINGS.TEXTAREA_PADDING}px`,
      fontSize: `${textNode.fontSize()}px`,
      border: 'none',
      padding: '0px',
      margin: '0px',
      overflow: 'hidden',
      background: 'none',
      outline: 'none',
      resize: 'none',
      lineHeight: textNode.lineHeight().toString(),
      fontFamily: textNode.fontFamily(),
      transformOrigin: 'left top',
      textAlign: textNode.align(),
      color: textNode.fill(),
      zIndex: '1000',
    };

    Object.assign(textarea.style, styles);
    this.applyRotationTransform(textarea, textNode);
  }

  private applyRotationTransform(textarea: HTMLTextAreaElement, textNode: Konva.Text): void {
    const rotation = textNode.rotation();
    let transform = rotation ? `rotateZ(${rotation}deg)` : '';

    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      const px = 2 + Math.round(textNode.fontSize() / 20);
      transform += `translateY(-${px}px)`;
    }

    textarea.style.transform = transform;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + 3}px`;
  }

  private setupTextareaEvents(
    textarea: HTMLTextAreaElement,
    textNode: Konva.Text,
    options: { onFinish?: () => void } = {}
  ): void {
    const removeTextarea = () => {
      textarea.parentNode?.removeChild(textarea);
      window.removeEventListener('click', handleOutsideClick);
      textNode.show();
      this.callbacks.onShowTransformer?.();

      this.attachDoubleClickHandler(textNode);
      this.attachClickHandler(textNode);

      this.safeDraw();

      if (options.onFinish) {
        options.onFinish();
      }

      this.callbacks.onTransformEnd?.(textNode);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      if (e.target !== textarea) {
        textNode.text(textarea.value);
        removeTextarea();
      }
    };

    textarea.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === KEYS.ENTER && !e.shiftKey) {
        textNode.text(textarea.value);
        removeTextarea();
      }
      if (e.key === KEYS.ESCAPE) {
        removeTextarea();
      }
    });

    textarea.addEventListener('input', () => {
      this.updateTextareaSize(textarea, textNode);
    });

    textarea.addEventListener('input', () => {
      textNode.text(textarea.value);
      this.safeDraw();
    });

    setTimeout(() => {
      window.addEventListener('click', handleOutsideClick);
    }, 0);
  }

  private updateTextareaSize(textarea: HTMLTextAreaElement, textNode: Konva.Text): void {
    const scale = textNode.getAbsoluteScale().x;
    let newWidth = textNode.width() * scale;

    if (!newWidth) {
      newWidth = textNode.text().length * textNode.fontSize();
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isSafari || isFirefox) {
      newWidth = Math.ceil(newWidth);
    }

    textarea.style.width = `${newWidth}px`;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight + textNode.fontSize()}px`;
  }

  public updateTextProperties(node: Konva.Node, props: Partial<TextProperties>): void {
    if (node instanceof Konva.Text) {
      if (props.link !== undefined) {
        if (props.link) {
          if (!node.getAttr('originalFill')) {
            node.setAttr('originalFill', node.fill());
          }
          props.fill = DEFAULT_SETTINGS.LINK_COLOR;
          props.textDecoration = DEFAULT_SETTINGS.LINK_TEXT_DECORATION;
        } else {
          props.fill = node.getAttr('originalFill') || DEFAULT_SETTINGS.TEXT_COLOR;
          props.textDecoration = undefined;
          node.setAttr('originalFill', undefined);
        }
      }

      if (props.fill && node.getAttr('link') && props.link === undefined) {
        delete props.fill;
      }

      node.setAttrs({ ...node.getAttrs(), ...props });
      this.safeDraw();
      this.onDirty();
    }
  }
}
