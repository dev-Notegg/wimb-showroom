import { useState, useEffect, useRef } from "react";
import { Stage, Layer, Rect, Transformer } from "react-konva";

// Helper functions for calculating bounding boxes
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

const LimitedDragAndResize = () => {
  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [shapes, setShapes] = useState([
    {
      id: "rect1",
      x: window.innerWidth / 2 - 60,
      y: window.innerHeight / 2 - 60,
      width: 50,
      height: 50,
      fill: "red",
    },
    {
      id: "rect2",
      x: window.innerWidth / 2 + 10,
      y: window.innerHeight / 2 + 10,
      width: 50,
      height: 50,
      fill: "green",
    },
  ]);

  const shapeRefs = useRef(new Map());
  const trRef = useRef(null);

  // Set up Transformer after the layer mounts
  useEffect(() => {
    if (trRef.current) {
      const nodes = shapes.map((shape) => shapeRefs.current.get(shape.id));
      trRef.current.nodes(nodes);

      console.log("nodes", nodes);
    }
  }, [shapes]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Handle drag for transformer group
  const handleTransformerDrag = (e) => {
    if (!trRef.current) return;

    const nodes = trRef.current.nodes();
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

  return (
    <Stage width={stageSize.width} height={stageSize.height}>
      <Layer>
        {shapes.map((shape) => (
          <Rect
            key={shape.id}
            ref={(node) => {
              if (node) shapeRefs.current.set(shape.id, node);
            }}
            x={shape.x}
            y={shape.y}
            width={shape.width}
            height={shape.height}
            fill={shape.fill}
            draggable
          />
        ))}
        <Transformer
          ref={trRef}
          boundBoxFunc={boundBoxFunc}
          onDragMove={handleTransformerDrag}
        />
      </Layer>
    </Stage>
  );
};

export default LimitedDragAndResize;
