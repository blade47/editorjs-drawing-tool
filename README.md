# Drawing Tool

**Drawing Tool Block** for the [Editor.js](https://editorjs.io).


https://github.com/user-attachments/assets/e19af1f4-e933-4118-8a9c-0202bf3fb020


---

## Features

- **Image Uploading**: Upload images directly from the user's device.
- **Text Customization**: Control text properties like color, size, alignment, and style.
- **Linking**: Add hyperlinks to text.
- **Image Saving**: Supports saving images as base64-encoded strings or remotely via a custom uploader.
- **Configurable Height**: Customize the height of the drawing tool's canvas.

> **Note**: No server-side implementation is required for image uploading when using base64 encoding.

---

## Installation

Install the Drawing Tool package via Yarn:

```bash
yarn add @blade47/drawing-tool
```

### Import the Module

To use the tool in your project, include it as:

```javascript
import DrawingTool from '@blade47/drawing-tool';
```

---

## Usage

Add the Drawing Tool to the `tools` property of your Editor.js configuration:

```javascript
import DrawingTool from '@blade47/drawing-tool';

const editor = new EditorJS({
  tools: {
    drawingTool: {
      class: DrawingTool,
    },
  },
});
```

You can also configure the tool with custom options (see the **Configuration Parameters** section for details).

---

## Configuration Parameters

The Drawing Tool supports the following configuration parameters:

| **Field**            | **Type**                                   | **Description**                                             |
|----------------------|--------------------------------------------|-------------------------------------------------------------|
| uploader.uploadImage | `(base64Image: string) => Promise<string>` | *Optional*. A custom image uploader. See details below.     |

> If no custom uploader is provided in the configuration, the tool embeds images into the response as base64-encoded strings.

---

## Output Data

When the tool produces output, the data will have the following structure:

| **Field**     | **Type**        | **Description**                                     |
|---------------|-----------------|-----------------------------------------------------|
| canvasJson    | `string`        | JSON string representing the content of the canvas. |
| canvasImages  | `ImageData[]`   | Array of image data.                                |
| canvasHeight  | `number`        | Height of the canvas.                               |

---

### Output Data Example

```json
{
  "type": "drawingTool",
  "data": {
    "canvasJson": "{\"attrs\":{},\"className\":\"Layer\",\"children\":[{\"attrs\":{\"enabledAnchors\":[\"top-left\",\"top-right\",\"bottom-left\",\"bottom-right\"],\"padding\":5,\"borderStroke\":\"#00ff00\",\"anchorStroke\":\"#00ff00\",\"anchorFill\":\"#ffffff\"},\"className\":\"Transformer\"}]}",
    "canvasImages": [
      {
        "id": "image-mmxLYrn_iY-1740849273717",
        "src": "link or base64 encoded image",
        "attrs": {
          "image": {},
          "x": 258.6185044359949,
          "y": 73.33333333333331,
          "width": 582.7629911280102,
          "height": 586.6666666666667,
          "draggable": true,
          "name": "object",
          "id": "image-mmxLYrn_iY-1740849273717"
        }
      }
    ],
    "canvasHeight": 700
  }
}
```

---

## TypeScript Types

```typescript
export interface KonvaDrawingToolData {
  canvasJson: string | null;
  canvasImages: ImageData[];
  canvasHeight: number;
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

export interface KonvaDrawingToolConfig {
  uploader?: {
    uploadImage?: (base64Image: string) => Promise<string>;
  };
}
```

---

## Using a Custom Image Uploading Method

You can provide your own method to handle image uploads. The custom uploader can be passed via the `uploader` configuration parameter.

### Custom Image Uploader

The `uploadImage` method accepts a base64-encoded image string and should return a `Promise` resolving to the uploaded image's public URL.

#### Example:

```javascript
import DrawingTool from '@blade47/drawing-tool';

const editor = new EditorJS({
  tools: {
    drawingTool: {
      class: DrawingTool,
      config: {
        uploader: {
          /**
           * Upload image file to the server and return the uploaded image URL
           * @param {string} base64Image - Base64 encoded string of the selected image
           * @return {Promise<string>}
           */
          async uploadImage(base64Image: string): Promise<string> {
            // Implement your custom upload logic here
            return MyAjax.upload(base64Image).then((link) => link);
          },
        },
      },
    },
  },
});
```

---

## Key Points About Image Uploading

- **Default Behavior**: If no custom uploader is provided, images are embedded directly as base64-encoded data.
- **Custom Uploader**: The provided `uploadImage` method must return a URL pointing to the uploaded image.

This flexibility allows you to either keep everything client-side (base64) or implement a server-side upload mechanism tailored to your use case.
