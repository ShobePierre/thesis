import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Set PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

/**
 * CanvasEditor - Advanced Fabric.js-based canvas editor for editing quiz attachments
 * Supports images, PDFs (first page), drawing, text, shapes, colors, and more
 */
export default function CanvasEditor({ fileUrl, mimeType, filename, onClose, onSubmit }) {
  const canvasRef = useRef(null);
  const fabricRef = useRef(null);
  const historyRef = useRef([]);
  const drawingStateRef = useRef({ isDrawing: false, startPoint: null });
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [tool, setTool] = useState('select'); // select, draw, line, rect, circle, text
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(4);
  const [fillColor, setFillColor] = useState('#ffcccc');
  const [enableFill, setEnableFill] = useState(false); // Toggle for fill on/off
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fontSize, setFontSize] = useState(20);
  const [selectedObject, setSelectedObject] = useState(null);
  const [zoom, setZoom] = useState(100);

  // Initialize canvas
  useEffect(() => {
    const initCanvas = async () => {
      const container = canvasRef.current;
      if (!container) return;

      // Clear container
      container.innerHTML = '';
      const c = document.createElement('canvas');
      container.appendChild(c);

      // Create Fabric canvas
      const fabricCanvas = new fabric.Canvas(c, {
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });

      fabricRef.current = fabricCanvas;

      // Setup drawing brush
      fabricCanvas.freeDrawingBrush.color = brushColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;

      // Load content based on MIME type
      await loadContent(fabricCanvas, fileUrl, mimeType);

      // Event listeners
      const handleObjectSelected = (e) => {
        setSelectedObject(e.selected?.[0] || null);
      };

      const handleObjectModified = () => {
        pushHistory();
      };

      fabricCanvas.on('selection:created', handleObjectSelected);
      fabricCanvas.on('selection:updated', handleObjectSelected);
      fabricCanvas.on('selection:cleared', () => setSelectedObject(null));
      fabricCanvas.on('object:modified', handleObjectModified);
      fabricCanvas.on('object:added', pushHistory);
      fabricCanvas.on('path:created', pushHistory);

      // Initial history
      pushHistory();

      return () => {
        fabricCanvas.dispose();
      };
    };

    initCanvas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, mimeType]);

  // Setup shape drawing mouse events - in separate effect to use current tool
  useEffect(() => {
    if (!fabricRef.current) return;

    const handleMouseDown = (e) => {
      if (tool === 'text' && !isDrawingMode) {
        // Place text at click position
        const pointer = fabricRef.current.getPointer(e.e);
        const textObj = new fabric.Textbox('Edit me', {
          left: pointer.x,
          top: pointer.y,
          fontSize,
          fill: brushColor,
          width: 200,
        });
        fabricRef.current.add(textObj);
        fabricRef.current.setActiveObject(textObj);
        fabricRef.current.renderAll();
        pushHistory();
        setTool('select');
        return;
      }

      if (!['rect', 'circle', 'line'].includes(tool) || isDrawingMode) return;

      drawingStateRef.current.isDrawing = true;
      const pointer = fabricRef.current.getPointer(e.e);
      drawingStateRef.current.startPoint = { x: pointer.x, y: pointer.y };
    };

    const handleMouseMove = (e) => {
      const state = drawingStateRef.current;
      if (!state.isDrawing || !state.startPoint || !['rect', 'circle', 'line'].includes(tool)) return;

      const pointer = fabricRef.current.getPointer(e.e);
      const width = pointer.x - state.startPoint.x;
      const height = pointer.y - state.startPoint.y;

      // Find and update existing preview object or create new one
      const objects = fabricRef.current.getObjects();
      const previewObj = objects.find((o) => o.isPreview);
      
      if (previewObj) {
        fabricRef.current.remove(previewObj);
      }

      let shape;
      if (tool === 'rect') {
        shape = new fabric.Rect({
          left: Math.min(state.startPoint.x, pointer.x),
          top: Math.min(state.startPoint.y, pointer.y),
          width: Math.abs(width),
          height: Math.abs(height),
          fill: enableFill ? fillColor : 'transparent',
          stroke: brushColor,
          strokeWidth,
          isPreview: true,
          selectable: false,
          evented: false,
        });
      } else if (tool === 'circle') {
        shape = new fabric.Circle({
          left: state.startPoint.x,
          top: state.startPoint.y,
          radius: Math.sqrt(width * width + height * height) / 2,
          fill: enableFill ? fillColor : 'transparent',
          stroke: brushColor,
          strokeWidth,
          isPreview: true,
          selectable: false,
          evented: false,
        });
      } else if (tool === 'line') {
        shape = new fabric.Line([state.startPoint.x, state.startPoint.y, pointer.x, pointer.y], {
          stroke: brushColor,
          strokeWidth,
          isPreview: true,
          selectable: false,
          evented: false,
        });
      }

      if (shape) {
        fabricRef.current.add(shape);
        fabricRef.current.renderAll();
      }
    };

    const handleMouseUp = () => {
      const state = drawingStateRef.current;
      if (!state.isDrawing) return;
      state.isDrawing = false;
      state.startPoint = null;

      // Find and finalize the preview object
      const objects = fabricRef.current.getObjects();
      const previewObj = objects.find((o) => o.isPreview);
      if (previewObj) {
        // Remove the preview flag to make it permanent
        previewObj.isPreview = false;
        // Make the shape selectable
        previewObj.selectable = true;
        previewObj.evented = true;
      }

      fabricRef.current.renderAll();
      pushHistory();
      
      // Reset tool to select mode after shape is dropped (one-time action)
      setTool('select');
    };

    fabricRef.current.on('mouse:down', handleMouseDown);
    fabricRef.current.on('mouse:move', handleMouseMove);
    fabricRef.current.on('mouse:up', handleMouseUp);

    return () => {
      if (fabricRef.current) {
        fabricRef.current.off('mouse:down', handleMouseDown);
        fabricRef.current.off('mouse:move', handleMouseMove);
        fabricRef.current.off('mouse:up', handleMouseUp);
      }
    };
  }, [tool, isDrawingMode, fillColor, brushColor, strokeWidth, enableFill]);

  // Update drawing mode and brush settings
  useEffect(() => {
    if (!fabricRef.current) return;
    fabricRef.current.isDrawingMode = isDrawingMode;
    fabricRef.current.freeDrawingBrush.color = brushColor;
    fabricRef.current.freeDrawingBrush.width = brushSize;
  }, [isDrawingMode, brushColor, brushSize]);

  // Apply color changes to selected text in real-time
  useEffect(() => {
    if (!fabricRef.current || !selectedObject) return;
    
    // If it's a text object, update its color in real-time
    if (selectedObject.type === 'textbox' || selectedObject.type === 'text') {
      selectedObject.set({ fill: brushColor });
      fabricRef.current.renderAll();
    }
  }, [brushColor, selectedObject]);

  const pushHistory = () => {
    try {
      if (fabricRef.current) {
        const json = fabricRef.current.toJSON();
        historyRef.current.push(JSON.stringify(json));
      }
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  const loadContent = async (canvas, url, mimeType) => {
    if (!url) {
      canvas.setWidth(800);
      canvas.setHeight(600);
      return;
    }

    try {
      if (mimeType?.startsWith('image/')) {
        await loadImage(canvas, url);
      } else if (mimeType?.includes('pdf')) {
        await loadPdf(canvas, url);
      } else {
        // Try loading as image
        await loadImage(canvas, url);
      }
    } catch (err) {
      console.error('Error loading content:', err);
      canvas.setWidth(800);
      canvas.setHeight(600);
    }
  };

  const loadImage = (canvas, url) => {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        url,
        (img) => {
          const maxW = 1200;
          const scale = Math.min(1, maxW / img.width);
          const w = img.width * scale;
          const h = img.height * scale;

          canvas.setWidth(w);
          canvas.setHeight(h);
          img.set({ left: 0, top: 0, selectable: false, evented: false });
          img.scaleToWidth(w);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
          resolve();
        },
        { crossOrigin: 'anonymous' },
        (err) => reject(err)
      );
    });
  };

  const loadPdf = async (canvas, url) => {
    try {
      let pdf;
      if (url.startsWith('http')) {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      } else {
        pdf = await pdfjsLib.getDocument(url).promise;
      }

      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2 });
      const offscreen = document.createElement('canvas');
      offscreen.width = viewport.width;
      offscreen.height = viewport.height;
      const ctx = offscreen.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = offscreen.toDataURL('image/png');

      await loadImage(canvas, dataUrl);
    } catch (err) {
      console.error('PDF loading failed:', err);
      throw err;
    }
  };

  // Tool functions
  const enableDrawing = () => {
    setTool('draw');
    setIsDrawingMode(true);
  };

  const disableDrawing = () => {
    setTool('select');
    setIsDrawingMode(false);
  };

  const addText = () => {
    if (!fabricRef.current) return;
    disableDrawing();
    setTool('text');
  };

  const addRectangle = () => {
    // Ensure drawing mode is disabled first, then set the tool.
    // Previous ordering would set the tool then call disableDrawing()
    // which overwrote the tool back to 'select'. Swap the order.
    disableDrawing();
    setTool('rect');
  };

  const addCircle = () => {
    disableDrawing();
    setTool('circle');
  };

  const addLine = () => {
    disableDrawing();
    setTool('line');
  };

  const deleteSelected = () => {
    if (!fabricRef.current) return;
    const active = fabricRef.current.getActiveObject();
    if (active) {
      fabricRef.current.remove(active);
      fabricRef.current.renderAll();
      pushHistory();
    }
  };

  const undo = () => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const prevState = historyRef.current[historyRef.current.length - 1];
      if (prevState) {
        fabricRef.current.loadFromJSON(JSON.parse(prevState), () => {
          fabricRef.current.renderAll();
        });
      }
    }
  };

  const clear = () => {
    if (!fabricRef.current || !window.confirm('Clear all annotations?')) return;
    const bg = fabricRef.current.backgroundImage;
    fabricRef.current.clear();
    if (bg) {
      fabricRef.current.setBackgroundImage(bg, fabricRef.current.renderAll.bind(fabricRef.current));
    }
    historyRef.current = [];
    pushHistory();
  };

  const handleZoom = (direction) => {
    const newZoom = direction === 'in' ? zoom + 20 : Math.max(50, zoom - 20);
    setZoom(newZoom);
    if (fabricRef.current) {
      fabricRef.current.setZoom(newZoom / 100);
      fabricRef.current.renderAll();
    }
  };

  const exportAndSubmit = async () => {
    if (!fabricRef.current) return;
    try {
      const dataUrl = fabricRef.current.toDataURL({
        format: 'png',
        quality: 0.95,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File(
        [blob],
        (filename || 'edited') + '.png',
        { type: 'image/png' }
      );

      onSubmit(file);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export image');
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Header Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-3 space-y-2">
        {/* Row 1: Main Tools */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={disableDrawing}
            title="Select objects (Esc)"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'select'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ➜ Select
          </button>

          <button
            onClick={enableDrawing}
            title="Free draw with brush"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'draw'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ✏️ Draw
          </button>

          <button
            onClick={addText}
            title="Add text"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            📝 Text
          </button>

          <button
            onClick={addRectangle}
            title="Draw rectangle"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'rect'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            □ Rectangle
          </button>

          <button
            onClick={addCircle}
            title="Draw circle"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'circle'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            ○ Circle
          </button>

          <button
            onClick={addLine}
            title="Draw line"
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              tool === 'line'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            / Line
          </button>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={undo}
            title="Undo (Ctrl+Z)"
            className="px-3 py-2 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            ↶ Undo
          </button>

          <button
            onClick={deleteSelected}
            title="Delete selected object (Del)"
            className="px-3 py-2 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            🗑️ Delete
          </button>

          <button
            onClick={clear}
            title="Clear all"
            className="px-3 py-2 rounded text-sm font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition"
          >
            Clear
          </button>

          <div className="h-6 w-px bg-gray-700" />

          <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition cursor-pointer text-sm">
            🎨 Color
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </label>

          <button
            onClick={() => setEnableFill(!enableFill)}
            title={enableFill ? 'Fill is on' : 'Fill is off'}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              enableFill
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {enableFill ? '⬜ Fill: ON' : '⬜ Fill: OFF'}
          </button>

          <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 text-gray-300 text-sm">
            🎨 Fill Color
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-8 h-8 cursor-pointer"
            />
          </label>
        </div>

        {/* Row 2: Settings */}
        <div className="flex flex-wrap gap-3 items-center">
          <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 text-gray-300 text-sm">
            Brush Size: {brushSize}px
            <input
              type="range"
              min={1}
              max={50}
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24"
            />
          </label>

          <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 text-gray-300 text-sm">
            Stroke: {strokeWidth}px
            <input
              type="range"
              min={1}
              max={10}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-20"
            />
          </label>

          <label className="flex items-center gap-2 px-3 py-2 rounded bg-gray-700 text-gray-300 text-sm">
            Font Size: {fontSize}px
            <input
              type="range"
              min={8}
              max={72}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-20"
            />
          </label>

          <div className="h-6 w-px bg-gray-700" />

          <button
            onClick={() => handleZoom('in')}
            className="px-3 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition"
          >
            🔍+ {zoom}%
          </button>

          <button
            onClick={() => handleZoom('out')}
            className="px-3 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm font-medium transition"
          >
            🔍-
          </button>

          <div className="ml-auto flex gap-2">
            <button
              onClick={exportAndSubmit}
              className="px-4 py-2 rounded bg-green-600 text-white font-medium hover:bg-green-700 transition"
            >
              💾 Export & Submit
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-red-600 text-white font-medium hover:bg-red-700 transition"
            >
              ✕ Close
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center"
        style={{ backgroundColor: '#111' }}
      />

      {/* Info Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 text-xs text-gray-400 flex justify-between">
        <span>
          {selectedObject
            ? `Selected: ${selectedObject.type}`
            : 'No object selected'}
        </span>
        <span>{filename || 'Canvas Editor'}</span>
      </div>
    </div>
  );
}
