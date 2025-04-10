import {
  Stage,
  Layer,
  RegularPolygon,
  Circle,
  Text,
  Transformer,
  Rect,
} from "react-konva";
import { useState, useRef, useEffect } from "react";

const App = () => {
  const [message, setMessage] = useState("");
  const stageRef = useRef();

  const shapeRefs = useRef(new Map());
  const trRef = useRef(null);

  const [shapes, setShapes] = useState([
    {
      id: "polygon",
      x: 80,
      y: 120,
      sides: 3,
      radius: 80,
      fill: "#00D2FF",
      stroke: "black",
      strokeWidth: 4,
    },
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

  // Set up Transformer after the layer mounts
  useEffect(() => {
    if (trRef.current) {
      const nodes = [{ id: "circle" }].map((shape) =>
        shapeRefs.current.get(shape.id)
      );

      console.log("nodes", nodes);
      trRef.current.nodes(nodes);

      console.log("nodes", nodes);
    }
  }, [shapes]);

  const handleTriangleTouch = () => {
    const touchPos = stageRef.current.getPointerPosition();
    setMessage(`x: ${touchPos.x}, y: ${touchPos.y}`);
  };

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
    <Stage width={window.innerWidth} height={window.innerHeight} ref={stageRef}>
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
        <Text
          x={10}
          y={10}
          fontFamily="Calibri"
          fontSize={24}
          text={message}
          fill="black"
        />
        <RegularPolygon
          x={80}
          y={120}
          sides={3}
          radius={80}
          fill="#00D2FF"
          stroke="black"
          strokeWidth={4}
          onTouchmove={handleTriangleTouch}
          ref={(node) => {
            if (node) shapeRefs.current.set("polygon", node);
          }}
          draggable
        />
        <Circle
          x={230}
          y={100}
          radius={60}
          fill="red"
          stroke="black"
          strokeWidth={4}
          onTouchstart={() => setMessage("touchstart circle")}
          onTouchend={() => setMessage("touchend circle")}
          ref={(node) => {
            if (node) shapeRefs.current.set("circle", node);
          }}
          draggable
        />
        <Transformer
          ref={trRef}
          // boundBoxFunc={boundBoxFunc}
          onDragMove={handleTransformerDrag}
        />
      </Layer>
    </Stage>
  );
};

export default App;
