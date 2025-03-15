import { BaseModule } from './base-module';
import { ModuleOptions, EventCallbacks, TextProperties, AlignmentOption } from '../types/types';
import { CANVAS_SIZES, DEFAULT_SETTINGS } from '../constants';
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

  private linkDialog: HTMLDivElement | null = null;
  private linkInput: HTMLInputElement | null = null;
  private dialogOverlay: HTMLDivElement | null = null;
  private selectedText: Konva.Text | null = null;

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

  public createMainToolbar(canvasHeight: number): HTMLDivElement {
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
    leftSection.appendChild(this.createSizeSelector(canvasHeight));

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

  private createSizeSelector(canvasHeight: number): HTMLSelectElement {
    const select = document.createElement('select');
    select.classList.add('konva-size-selector');

    CANVAS_SIZES.forEach((size) => {
      const option = document.createElement('option');
      option.value = size.value;
      option.text = size.label;
      if (canvasHeight === parseInt(size.value)) {
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
    const linkControls = this.createLinkControls();

    const colorPickerWrapper = document.createElement('div');
    colorPickerWrapper.style.position = 'relative';
    colorPickerWrapper.appendChild(colorPicker);

    const colorTooltip = document.createElement('div');
    colorTooltip.textContent = 'Links are always blue';
    colorTooltip.style.cssText = `
    display: none;
    position: absolute;
    bottom: 120%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 3px;
    white-space: nowrap;
    font-size: 11px;
    pointer-events: none;
  `;
    colorPickerWrapper.appendChild(colorTooltip);

    colorPicker.addEventListener('mouseover', () => {
      if (colorPicker.disabled) {
        colorTooltip.style.display = 'block';
      }
    });

    colorPicker.addEventListener('mouseout', () => {
      colorTooltip.style.display = 'none';
    });

    this.textToolbar.appendChild(fontSizeSelector);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(styleControls);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(alignmentControls);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(colorPickerWrapper);
    this.textToolbar.appendChild(this.createSeparator());
    this.textToolbar.appendChild(linkControls);

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

      if (this.selectedText && !this.selectedText.getAttr('link')) {
        this.updateTextProperty({ fill: value });
      } else if (this.selectedText && this.selectedText.getAttr('link')) {
        colorPicker.value = DEFAULT_SETTINGS.LINK_COLOR;

        this.notifier?.show({
          message: 'Link color cannot be changed. Remove the link to change the color.',
          style: 'info',
        });
      }
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

    this.selectedText = isText ? (selectedNode as Konva.Text) : null;

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
      colorPicker.value = textNode.fill() as string;
      colorPicker.disabled = !!textNode.getAttr('link');

      if (textNode.getAttr('link')) {
        colorPicker.style.opacity = '0.5';
        colorPicker.title = 'Color cannot be changed for linked text';
      } else {
        colorPicker.style.opacity = '1';
        colorPicker.title = 'Text Color';
      }
    }

    const alignButtons = this.textToolbar.querySelectorAll('[data-tool^="align-"]');
    alignButtons.forEach((button) => {
      const alignValue = button.getAttribute('data-tool')?.replace('align-', '');
      button.classList.toggle('active', alignValue === textNode.align());
    });

    const linkButton = this.textToolbar.querySelector('[data-tool="link"]');
    if (linkButton) {
      linkButton.classList.toggle('active', !!textNode.getAttr('link'));
    }
  }

  private createLinkControls(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.gap = '4px';

    const linkButton = this.createToolButton({
      name: 'link',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>',
      action: () => this.showLinkDialog(),
      tooltip: 'Add Link (Ctrl+K)',
    });

    container.appendChild(linkButton);
    return container;
  }

  private createLinkDialog(): HTMLDivElement {
    if (!this.linkDialog) {
      this.dialogOverlay = document.createElement('div');
      this.dialogOverlay.style.position = 'fixed';
      this.dialogOverlay.style.top = '0';
      this.dialogOverlay.style.left = '0';
      this.dialogOverlay.style.right = '0';
      this.dialogOverlay.style.bottom = '0';
      this.dialogOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
      this.dialogOverlay.style.zIndex = '9999';
      this.dialogOverlay.style.display = 'none';
      this.dialogOverlay.onclick = () => this.hideLinkDialog();
      document.body.appendChild(this.dialogOverlay);

      this.linkDialog = document.createElement('div');
      this.linkDialog.classList.add('konva-link-dialog');
      this.linkDialog.style.display = 'none';

      this.linkDialog.style.position = 'fixed';
      this.linkDialog.style.backgroundColor = 'white';
      this.linkDialog.style.padding = '20px';
      this.linkDialog.style.borderRadius = '6px';
      this.linkDialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      this.linkDialog.style.zIndex = '10000';
      this.linkDialog.style.minWidth = '320px';
      this.linkDialog.style.maxWidth = '400px';

      const title = document.createElement('h3');
      title.textContent = 'Link Settings';
      title.style.margin = '0 0 16px 0';
      title.style.color = '#333';
      title.style.fontSize = '16px';

      const label = document.createElement('label');
      label.textContent = 'URL:';
      label.htmlFor = 'konva-link-url';
      label.style.display = 'block';
      label.style.marginBottom = '8px';
      label.style.fontWeight = 'bold';

      this.linkInput = document.createElement('input');
      this.linkInput.type = 'text';
      this.linkInput.id = 'konva-link-url';
      this.linkInput.placeholder = 'https://example.com';
      this.linkInput.style.width = '100%';
      this.linkInput.style.padding = '8px';
      this.linkInput.style.boxSizing = 'border-box';
      this.linkInput.style.border = '1px solid #ddd';
      this.linkInput.style.borderRadius = '4px';
      this.linkInput.style.marginBottom = '16px';

      const hintText = document.createElement('p');
      hintText.textContent = 'Ctrl+Click (or Cmd+Click) on linked text to open the URL.';
      hintText.style.margin = '0 0 16px 0';
      hintText.style.fontSize = '12px';
      hintText.style.color = '#666';

      const buttonsContainer = document.createElement('div');
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '8px';
      buttonsContainer.style.justifyContent = 'flex-end';

      const applyButton = document.createElement('button');
      applyButton.textContent = 'Apply';
      applyButton.style.padding = '8px 16px';
      applyButton.style.background = '#4CAF50';
      applyButton.style.color = 'white';
      applyButton.style.border = 'none';
      applyButton.style.borderRadius = '4px';
      applyButton.style.cursor = 'pointer';
      applyButton.onclick = () => this.applyLink();

      const removeButton = document.createElement('button');
      removeButton.textContent = 'Remove Link';
      removeButton.style.padding = '8px 16px';
      removeButton.style.background = '#f44336';
      removeButton.style.color = 'white';
      removeButton.style.border = 'none';
      removeButton.style.borderRadius = '4px';
      removeButton.style.cursor = 'pointer';
      removeButton.onclick = () => this.removeLink();

      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.background = '#ddd';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      cancelButton.onclick = () => this.hideLinkDialog();

      buttonsContainer.appendChild(applyButton);
      buttonsContainer.appendChild(removeButton);
      buttonsContainer.appendChild(cancelButton);

      this.linkDialog.appendChild(title);
      this.linkDialog.appendChild(label);
      this.linkDialog.appendChild(this.linkInput);
      this.linkDialog.appendChild(hintText);
      this.linkDialog.appendChild(buttonsContainer);

      document.body.appendChild(this.linkDialog);
    }

    return this.linkDialog;
  }

  private showLinkDialog(): void {
    if (!this.linkDialog) {
      this.createLinkDialog();
    }

    if (this.selectedText) {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const dialogWidth = 400;

      this.linkDialog.style.left = `${(viewportWidth - dialogWidth) / 2}px`;
      this.linkDialog.style.top = `${Math.max(50, viewportHeight / 4)}px`;

      if (this.linkInput) {
        this.linkInput.value = this.selectedText.getAttr('link') || '';
      }

      if (this.dialogOverlay) {
        this.dialogOverlay.style.display = 'block';
      }

      this.linkDialog.style.display = 'block';
      this.linkInput.focus();
    }
  }

  private hideLinkDialog(): void {
    if (this.linkDialog) {
      this.linkDialog.style.display = 'none';

      if (this.dialogOverlay) {
        this.dialogOverlay.style.display = 'none';
      }
    }
  }

  private applyLink(): void {
    if (this.selectedText && this.linkInput) {
      const url = this.linkInput.value.trim();

      if (url) {
        this.updateTextProperty({
          link: url,
          fill: DEFAULT_SETTINGS.LINK_COLOR,
          textDecoration: DEFAULT_SETTINGS.LINK_TEXT_DECORATION,
        });
      }

      this.hideLinkDialog();
    }
  }

  private removeLink(): void {
    if (this.selectedText) {
      const originalFill = this.selectedText.getAttr('originalFill') || DEFAULT_SETTINGS.TEXT_COLOR;

      this.updateTextProperty({
        link: undefined,
        textDecoration: undefined,
        fill: originalFill,
      });

      this.selectedText.setAttr('originalFill', undefined);
      this.hideLinkDialog();
    }
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
    if (this.linkDialog) {
      this.linkDialog.remove();
    }
    if (this.dialogOverlay) {
      this.dialogOverlay.remove();
    }
  }
}
