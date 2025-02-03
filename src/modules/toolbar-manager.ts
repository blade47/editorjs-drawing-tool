import { BaseModule } from './base-module';
import { ModuleOptions, EventCallbacks, TextProperties, AlignmentOption } from '../types/types';
import { CANVAS_SIZES } from '../constants';
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconPicture,
  IconTrash,
  IconText,
  IconBold,
} from '@codexteam/icons';
import Konva from 'konva';

interface ToolbarItem {
  name: string;
  icon: string;
  action: () => void;
  tooltip?: string;
  disabled?: boolean;
}

export class ToolbarManager extends BaseModule {
  private mainToolbar: HTMLDivElement | null = null;
  private textToolbar: HTMLDivElement | null = null;
  private saveIndicator: HTMLSpanElement | null = null;
  private imageInput: HTMLInputElement | null = null;
  private currentTextProps: TextProperties;

  constructor(options: ModuleOptions, callbacks: EventCallbacks = {}) {
    super(options, callbacks);
    this.currentTextProps = this.getDefaultTextProps();
    this.initializeStyles();
  }

  private initializeStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
            .konva-toolbar {
                display: flex;
                align-items: center;
                padding: 8px;
                background: #fff;
                border-bottom: 1px solid #eee;
                gap: 8px;
            }

            .konva-toolbar button {
                padding: 6px;
                border: 1px solid #ddd;
                background: white;
                border-radius: 4px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
            }

            .konva-toolbar button:hover:not(:disabled) {
                background: #f5f5f5;
                border-color: #bbb;
            }

            .konva-toolbar button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .konva-toolbar button.active {
                background: #e0e0e0;
                border-color: #999;
            }

            .konva-toolbar select,
            .konva-toolbar input[type="color"] {
                padding: 4px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
            }

            .konva-toolbar input[type="color"] {
                width: 32px;
                height: 32px;
                padding: 2px;
            }

            .konva-toolbar .separator {
                width: 1px;
                height: 24px;
                background: #ddd;
                margin: 0 8px;
            }

            .konva-save-indicator {
                font-size: 12px;
                font-style: italic;
                margin-left: auto;
                padding: 4px 8px;
                border-radius: 4px;
            }
        `;
    document.head.appendChild(style);
  }

  public createMainToolbar(): HTMLDivElement {
    this.mainToolbar = document.createElement('div');
    this.mainToolbar.classList.add('konva-toolbar', 'konva-main-toolbar');

    const toolsContainer = this.createToolsContainer();
    this.saveIndicator = this.createSaveIndicator();
    this.imageInput = this.createImageInput();

    const leftSection = document.createElement('div');
    leftSection.style.display = 'flex';
    leftSection.style.alignItems = 'center';
    leftSection.style.gap = '8px';
    leftSection.appendChild(toolsContainer);
    leftSection.appendChild(this.createSeparator());
    leftSection.appendChild(this.createSizeSelector());

    const rightSection = document.createElement('div');
    rightSection.style.display = 'flex';
    rightSection.style.alignItems = 'center';
    rightSection.style.marginLeft = 'auto';
    rightSection.appendChild(this.saveIndicator);

    this.mainToolbar.appendChild(leftSection);
    this.mainToolbar.appendChild(rightSection);
    this.mainToolbar.appendChild(this.imageInput);

    return this.mainToolbar;
  }

  private createToolsContainer(): HTMLDivElement {
    const toolsContainer = document.createElement('div');
    toolsContainer.style.display = 'flex';
    toolsContainer.style.gap = '4px';
    toolsContainer.style.alignItems = 'center';

    const tools: ToolbarItem[] = [
      {
        name: 'text',
        icon: IconText,
        action: () => this.callbacks.onAddText?.(),
        tooltip: 'Add Text (T)',
      },
      {
        name: 'image',
        icon: IconPicture,
        action: () => this.imageInput?.click(),
        tooltip: 'Add Image',
      },
      {
        name: 'delete',
        icon: IconTrash,
        action: () => {
          this.callbacks.onDelete?.();
        },
        tooltip: 'Delete (Del)',
        disabled: true,
      },
    ];

    tools.forEach((tool) => {
      const button = this.createToolButton(tool);
      toolsContainer.appendChild(button);
    });

    return toolsContainer;
  }

  private createToolButton(tool: ToolbarItem): HTMLButtonElement {
    const button = document.createElement('button');
    button.innerHTML = tool.icon;
    button.title = tool.tooltip || tool.name;
    button.disabled = tool.disabled || false;
    button.dataset.tool = tool.name;
    button.addEventListener('click', tool.action);
    return button;
  }

  private createSeparator(): HTMLDivElement {
    const separator = document.createElement('div');
    separator.classList.add('separator');
    return separator;
  }

  private createImageInput(): HTMLInputElement {
    const imageInput = document.createElement('input');
    imageInput.type = 'file';
    imageInput.accept = 'image/*';
    imageInput.style.display = 'none';
    imageInput.addEventListener('change', (e: Event) => {
      this.callbacks.onImageUpload?.(e);
    });
    return imageInput;
  }

  private createSizeSelector(): HTMLSelectElement {
    const select = document.createElement('select');
    select.classList.add('konva-size-selector');

    CANVAS_SIZES.forEach((size) => {
      const option = document.createElement('option');
      option.value = size.value;
      option.text = size.label;
      if (this.stage.height() === parseInt(size.value)) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      const value = parseInt((e.target as HTMLSelectElement).value);
      this.callbacks.onCanvasResize?.(value);
    });

    return select;
  }

  private createSaveIndicator(): HTMLSpanElement {
    const saveIndicator = document.createElement('span');
    saveIndicator.classList.add('konva-save-indicator');
    return saveIndicator;
  }

  public createTextToolbar(): HTMLDivElement {
    this.textToolbar = document.createElement('div');
    this.textToolbar.classList.add('konva-toolbar', 'konva-text-toolbar');

    const fontSizeSelector = this.createFontSizeSelector();
    const styleControls = this.createStyleControls();
    const alignmentControls = this.createAlignmentControls();
    const colorPicker = this.createColorPicker();

    this.textToolbar.appendChild(fontSizeSelector);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(styleControls);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(alignmentControls);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(colorPicker);

    return this.textToolbar;
  }

  private createFontSizeSelector(): HTMLSelectElement {
    const fontSize = document.createElement('select');
    fontSize.classList.add('konva-font-size');

    const sizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];
    sizes.forEach((size) => {
      const option = document.createElement('option');
      option.value = size.toString();
      option.text = `${size}px`;

      if (size === this.currentTextProps.fontSize) {
        option.selected = true;
      }
      fontSize.appendChild(option);
    });

    fontSize.addEventListener('change', (e) => {
      const value = parseInt((e.target as HTMLSelectElement).value);
      this.updateTextProperty({ fontSize: value });
    });

    return fontSize;
  }

  private createStyleControls(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';

    const boldButton = this.createToolButton({
      name: 'bold',
      icon: IconBold,
      action: () => {
        const newStyle = this.currentTextProps.fontStyle === 'bold' ? 'normal' : 'bold';
        this.updateTextProperty({ fontStyle: newStyle });
        boldButton.classList.toggle('active');
      },
      tooltip: 'Bold (Ctrl+B)',
    });

    container.appendChild(boldButton);
    return container;
  }

  private createAlignmentControls(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';

    const alignments: AlignmentOption[] = [
      { value: 'left', icon: IconAlignLeft },
      { value: 'center', icon: IconAlignCenter },
      { value: 'right', icon: IconAlignRight },
    ];

    alignments.forEach((align) => {
      const button = this.createToolButton({
        name: `align-${align.value}`,
        icon: align.icon,
        action: () => {
          this.updateTextProperty({ align: align.value as 'left' | 'center' | 'right' });
          container.querySelectorAll('button').forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
        },
        tooltip: `Align ${align.value}`,
      });
      container.appendChild(button);
    });

    return container;
  }

  private createColorPicker(): HTMLInputElement {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = this.currentTextProps.fill as string;
    colorPicker.title = 'Text Color';

    colorPicker.addEventListener('change', (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.updateTextProperty({ fill: value });
    });

    return colorPicker;
  }

  private updateTextProperty(props: Partial<TextProperties>): void {
    this.currentTextProps = { ...this.currentTextProps, ...props };
    this.callbacks.onTextPropertyChange?.(this.currentTextProps);
  }

  public updateToolbarState(selectedNode: Konva.Node | null): void {
    if (!this.mainToolbar || !this.textToolbar) return;

    const deleteButton = this.mainToolbar.querySelector(
      '[data-tool="delete"]'
    ) as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.disabled = !selectedNode;
    }

    const isText = selectedNode instanceof Konva.Text;
    this.textToolbar.querySelectorAll('button, select, input').forEach((element) => {
      if (
        element instanceof HTMLButtonElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLInputElement
      ) {
        element.disabled = !isText;
      }
    });

    if (isText) {
      this.updateTextToolbarValues(selectedNode as Konva.Text);
    }
  }

  private updateTextToolbarValues(textNode: Konva.Text): void {
    if (!this.textToolbar) return;

    this.currentTextProps = {
      ...textNode.getAttrs(),
      align: textNode.getAttr('align'),
    };

    const fontSize = this.textToolbar.querySelector('.konva-font-size') as HTMLSelectElement;
    if (fontSize) {
      fontSize.value = textNode.fontSize().toString();
    }

    const boldButton = this.textToolbar.querySelector('[data-tool="bold"]');
    if (boldButton) {
      boldButton.classList.toggle('active', textNode.fontStyle() === 'bold');
    }

    const colorPicker = this.textToolbar.querySelector('input[type="color"]') as HTMLInputElement;
    if (colorPicker) {
      colorPicker.value = <string>textNode.fill();
    }

    const alignButtons = this.textToolbar.querySelectorAll('[data-tool^="align-"]');
    alignButtons.forEach((button) => {
      const alignValue = button.getAttribute('data-tool')?.replace('align-', '');
      button.classList.toggle('active', alignValue === textNode.align());
    });
  }

  public updateSaveIndicator(isDirty: boolean): void {
    if (this.saveIndicator) {
      this.saveIndicator.textContent = isDirty ? 'Unsaved changes' : 'All changes saved';
      this.saveIndicator.style.color = isDirty ? '#ff4444' : '#44aa44';
      this.saveIndicator.style.background = isDirty ? '#ffeeee' : '#eeffee';
    }
  }

  public destroy(): void {
    if (this.mainToolbar) {
      this.mainToolbar.remove();
    }
    if (this.textToolbar) {
      this.textToolbar.remove();
    }
  }
}
