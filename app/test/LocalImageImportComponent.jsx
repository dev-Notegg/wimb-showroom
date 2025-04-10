import { Stage, Layer, Rect, Transformer, Image } from "react-konva";
import { useState, useEffect, useRef } from "react";

import useImage from "use-image";

const initialRectangles = [
  {
    x: 60,
    y: 60,
    width: 100,
    height: 90,
    fill: "red",
    id: "rect1",
    name: "rect",
  },
  {
    x: 250,
    y: 100,
    width: 150,
    height: 90,
    fill: "green",
    id: "rect2",
    name: "rect",
  },
];

function SimpleApp() {
  const [image] = useImage(url);

  // "image" will be DOM image element or undefined

  return <Image image={image} />;
}

const App = () => {
  const [rectangles, setRectangles] = useState(initialRectangles);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectionRectangle, setSelectionRectangle] = useState({
    visible: false,
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  const [images, setImages] = useState([]);

  const isSelecting = useRef(false);
  const transformerRef = useRef();
  const rectRefs = useRef(new Map());

  const stageRef = useRef();

  // // Update transformer when selection changes
  // useEffect(() => {
  //   if (selectedIds.length && transformerRef.current) {
  //     // Get the nodes from the refs Map
  //     const nodes = selectedIds
  //       .map((id) => rectRefs.current.get(id))
  //       .filter((node) => node);

  //     transformerRef.current.nodes(nodes);
  //   } else if (transformerRef.current) {
  //     // Clear selection
  //     transformerRef.current.nodes([]);
  //   }
  // }, [selectedIds]);

  // Click handler for stage
  const handleStageClick = (e) => {
    // If we are selecting with rect, do nothing
    if (selectionRectangle.visible) {
      return;
    }

    // If click on empty area - remove all selections
    if (e.target === e.target.getStage()) {
      setSelectedIds([]);
      return;
    }

    // Do nothing if clicked NOT on our rectangles
    if (!e.target.hasName("rect")) {
      return;
    }

    const clickedId = e.target.id();

    // Do we pressed shift or ctrl?
    const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
    const isSelected = selectedIds.includes(clickedId);

    if (!metaPressed && !isSelected) {
      // If no key pressed and the node is not selected
      // select just one
      setSelectedIds([clickedId]);
    } else if (metaPressed && isSelected) {
      // If we pressed keys and node was selected
      // we need to remove it from selection
      setSelectedIds(selectedIds.filter((id) => id !== clickedId));
    } else if (metaPressed && !isSelected) {
      // Add the node into selection
      setSelectedIds([...selectedIds, clickedId]);
    }
  };

  const handleMouseDown = (e) => {
    // Do nothing if we mousedown on any shape
    if (e.target !== e.target.getStage()) {
      return;
    }

    // Start selection rectangle
    isSelecting.current = true;
    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle({
      visible: true,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
    });
  };

  const handleMouseMove = (e) => {
    // Do nothing if we didn't start selection
    if (!isSelecting.current) {
      return;
    }

    const pos = e.target.getStage().getPointerPosition();
    setSelectionRectangle({
      ...selectionRectangle,
      x2: pos.x,
      y2: pos.y,
    });
  };

  const handleMouseUp = () => {
    // Do nothing if we didn't start selection
    if (!isSelecting.current) {
      return;
    }
    isSelecting.current = false;

    // Update visibility in timeout, so we can check it in click event
    setTimeout(() => {
      setSelectionRectangle({
        ...selectionRectangle,
        visible: false,
      });
    });

    const selBox = {
      x: Math.min(selectionRectangle.x1, selectionRectangle.x2),
      y: Math.min(selectionRectangle.y1, selectionRectangle.y2),
      width: Math.abs(selectionRectangle.x2 - selectionRectangle.x1),
      height: Math.abs(selectionRectangle.y2 - selectionRectangle.y1),
    };

    const selected = rectangles.filter((rect) => {
      // Check if rectangle intersects with selection box
      return Konva.Util.haveIntersection(selBox, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    });

    setSelectedIds(selected.map((rect) => rect.id));
  };

  const handleDragEnd = (e) => {
    const id = e.target.id();
    const index = rectangles.findIndex((r) => r.id === id);

    if (index !== -1) {
      const rects = [...rectangles];
      rects[index] = {
        ...rects[index],
        x: e.target.x(),
        y: e.target.y(),
      };
      setRectangles(rects);
    }
  };

  const handleImageDragEnd = (e) => {
    const id = e.target.id();
    const index = images.findIndex((r) => r.id === id);

    if (index !== -1) {
      const rects = [...images];
      rects[index] = {
        ...rects[index],
        x: e.target.x(),
        y: e.target.y(),
      };
      setImages(rects);
    }
  };

  const handleTransformEnd = (e) => {
    // Find which rectangle(s) were transformed
    const nodes = transformerRef.current.nodes();

    const newRects = [...images];

    // Update each transformed node
    nodes.forEach((node) => {
      const id = node.id();
      const index = newRects.findIndex((r) => r.id === id);

      if (index !== -1) {
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Reset scale
        node.scaleX(1);
        node.scaleY(1);

        // Update the state with new values
        newRects[index] = {
          ...newRects[index],
          x: node.x(),
          y: node.y(),
          width: Math.max(5, node.width() * scaleX),
          height: Math.max(node.height() * scaleY),
        };
      }
    });

    setImages(newRects);
  };

  const fileInputOnChange = (e) => {
    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(e.target.files[0]);

    console.log("e.target.files[0]", e.target.files[0]);
    console.log("url", url);

    setImages([
      { url: url, id: "images", x: 0, y: 0, width: 500, height: 500 },
    ]);

    // url.onload = function () {
    //   var img_width = img.width;
    //   var img_height = img.height;

    //   // calculate dimensions to get max 300px
    //   var max = 300;
    //   var ratio = img_width > img_height ? img_width / max : img_height / max;

    //   // now load the Konva image
    //   var theImg = new Konva.Image({
    //     image: img,
    //     x: 50,
    //     y: 30,
    //     width: img_width / ratio,
    //     height: img_height / ratio,
    //     draggable: true,
    //     rotation: 20,
    //   });
    // };
  };

  const URLImage = ({ src, ...rest }) => {
    console.log("src", rest);
    const [image] = useImage(src, "anonymous");
    return <Image image={image} {...rest} />;
  };

  // // Set up Transformer after the layer mounts
  // useEffect(() => {
  //   if (transformerRef.current && images.length > 0) {
  //     const nodes = [{ id: "images" }].map((shape) =>
  //       rectRefs.current.get(shape.id)
  //     );

  //     transformerRef.current.nodes(nodes);

  //     console.log("nodes", nodes);
  //   }
  // }, [images]);

  const getTotalBox = (boxes) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    boxes.forEach((box) => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const handleTransformerDrag = (e) => {
    if (!transformerRef.current) return;

    const nodes = transformerRef.current.nodes();
    if (nodes.length === 0) return;

    const boxes = nodes.map((node) => node.getClientRect());
    const box = getTotalBox(boxes);

    nodes.forEach((shape) => {
      const absPos = shape.getAbsolutePosition();
      const offsetX = box.x - absPos.x;
      const offsetY = box.y - absPos.y;

      const newAbsPos = { ...absPos };

      if (box.x < 0) {
        newAbsPos.x = -offsetX;
      }
      if (box.y < 0) {
        newAbsPos.y = -offsetY;
      }
      if (box.x + box.width > stageSize.width) {
        newAbsPos.x = stageSize.width - box.width - offsetX;
      }
      if (box.y + box.height > stageSize.height) {
        newAbsPos.y = stageSize.height - box.height - offsetY;
      }

      shape.setAbsolutePosition(newAbsPos);
    });
  };

  const handleTouch = () => {
    const nodes = [{ id: "images" }].map((shape) =>
      rectRefs.current.get(shape.id)
    );

    transformerRef.current.nodes(nodes);
  };

  const getCorner = (pivotX, pivotY, diffX, diffY, angle) => {
    const distance = Math.sqrt(diffX * diffX + diffY * diffY);
    angle += Math.atan2(diffY, diffX);
    const x = pivotX + distance * Math.cos(angle);
    const y = pivotY + distance * Math.sin(angle);
    return { x, y };
  };

  const getClientRect = (rotatedBox) => {
    const { x, y, width, height } = rotatedBox;
    const rad = rotatedBox.rotation;

    const p1 = getCorner(x, y, 0, 0, rad);
    const p2 = getCorner(x, y, width, 0, rad);
    const p3 = getCorner(x, y, width, height, rad);
    const p4 = getCorner(x, y, 0, height, rad);

    const minX = Math.min(p1.x, p2.x, p3.x, p4.x);
    const minY = Math.min(p1.y, p2.y, p3.y, p4.y);
    const maxX = Math.max(p1.x, p2.x, p3.x, p4.x);
    const maxY = Math.max(p1.y, p2.y, p3.y, p4.y);

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };

  // Boundary function for Transformer
  const boundBoxFunc = (oldBox, newBox) => {
    const box = getClientRect(newBox);

    const isOut =
      box.x < 0 ||
      box.y < 0 ||
      box.x + box.width > stageSize.width ||
      box.y + box.height > stageSize.height;

    if (isOut) {
      return oldBox;
    }

    return newBox;
  };

  return (
    <>
      <div>Render a local image without upload</div>
      <div>
        <input type="file" id="file_input" onChange={fileInputOnChange} />
      </div>
      <div id="canvas-container"></div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        // onMouseDown={handleMouseDown}
        // onMousemove={handleMouseMove}
        // onMouseup={handleMouseUp}
        // onClick={handleStageClick}
        ref={stageRef}
      >
        <Layer>
          {/* Render rectangles directly */}
          {rectangles.map((rect) => (
            <Rect
              key={rect.id}
              id={rect.id}
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              fill={rect.fill}
              name={rect.name}
              draggable
              ref={(node) => {
                if (node) {
                  rectRefs.current.set(rect.id, node);
                }
              }}
              onDragEnd={handleDragEnd}
            />
          ))}

          {images.map((image) => (
            <URLImage
              src={image.url}
              id={image.id}
              x={image.x}
              y={image.y}
              width={image.width}
              height={image.height}
              key={"url"}
              draggable
              onTouchstart={handleTouch}
              // onDragEnd={handleTransformEnd}
              // onDragEnd={handleImageDragEnd}
              ref={(node) => {
                if (node) {
                  rectRefs.current.set(image.id, node);
                }
              }}
            />
          ))}

          {/* Single transformer for all selected shapes */}
          <Transformer
            ref={transformerRef}
            boundBoxFunc={boundBoxFunc}
            // onTransformEnd={handleTransformEnd}
            onDragMove={handleTransformerDrag}
          />
        </Layer>
      </Stage>
    </>
  );
};

export default App;
