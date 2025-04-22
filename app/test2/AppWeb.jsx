import * as React from "react";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/web";

export default function AppWeb() {
  return (
    <div>
      <div>Web Demo (change index.js for Konva Demo)</div>
      <DrawingTool />
    </div>
  );
}

export const DrawingTool = () => {
  return (
    <div>
      <div
        style={{
          border: "1px solid #483D8B",
          width: "400px",
          height: "400px",
        }}
      >
        <RectNode />
      </div>
    </div>
  );
};

const RectNode = () => {
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    width: "100px",
    height: "100px",
    backgroundColor: "red",
    scale: 1,
  }));

  const ref = React.useRef(null);

  useGesture(
    {
      onDrag: (options) => {
        // if (options.pinching) return cancel();
        api.start({ x: options.offset[0], y: options.offset[1] });
      },
      onPinch: (options) => {
        api.start({ scale: options.offset[0] });
      },
    },
    {
      target: ref,
    }
  );

  return <animated.div style={style} ref={ref}></animated.div>;
};
