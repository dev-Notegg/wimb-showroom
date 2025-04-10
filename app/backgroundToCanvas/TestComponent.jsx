// 1. 배경색 변경

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle } from "react-konva";

import { SketchPicker } from "react-color";

const App = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const stageRef = useRef(null);
  const backgroundRef = useRef(null);

  const [color, setColor] = useState("#000");

  const handleChangeComplete = (color) => {
    const container = stageRef.current.container();

    container.style.backgroundColor = color.hex;
    setColor(color);
  };

  return (
    <>
      <div style={{ position: "absolute", zIndex: "999" }}>
        <SketchPicker color={color} onChange={handleChangeComplete} />
      </div>
      <Stage width={width} height={height} draggable ref={stageRef}>
        <Layer>
          <Rect ref={backgroundRef} x={0} y={0} width={width} height={height} />

          {/* Demo shape */}
          <Circle x={width / 2} y={height / 2} radius={100} fill="red" />
        </Layer>
      </Stage>
    </>
  );
};

export default App;
