"use client";

import * as React from "react";
import { Stage, Layer } from "react-konva";
import { useGesture } from "@use-gesture/react";
import { animated, useSpring, config } from "@react-spring/konva";

window.Konva.hitOnDragEnabled = true;
window.Konva.captureTouchEventsEnabled = true;

export default function AppKonva() {
  // React.useEffect(() => {
  //   const handler = (e) => e.preventDefault();
  //   document.addEventListener("gesturestart", handler);
  //   document.addEventListener("gesturechange", handler);
  //   return () => {
  //     document.removeEventListener("gesturestart", handler);
  //     document.removeEventListener("gesturechange", handler);
  //   };
  // }, []);

  return (
    <div>
      <div>Konva Demo (change index.js for Web Demo)</div>

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
          width: "1000px",
          height: "1000px",
        }}
      >
        <Stage width={1000} height={1000}>
          <Layer>
            <RectNode />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export const RectNode = () => {
  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    scale: { x: 1, y: 1 },
    rotation: 0,
    offsetX: 50,
    offsetY: 50,
  }));

  const ref = React.useRef(null);

  const props = useGesture(
    {
      onDrag: (options) => {
        api.start({ x: options.offset[0], y: options.offset[1] });
      },
      onPinch: (options) => {
        api.start({
          scale: { x: options.offset[0], y: options.offset[0] },
          rotation: options.offset[1],
        });
      },
    },
    {
      // https://use-gesture.netlify.app/docs/options/#pointercapture
      // https://use-gesture.netlify.app/docs/options/#pointertouch
      drag: {
        pointer: { capture: false, touch: true },
      },
      pinch: {
        pointer: { touch: true, capture: false },
        scaleBounds: { min: 0.5, max: 2 },
        rubberband: true,
      },
      target: ref,
    }
  );

  return (
    <animated.Rect ref={ref} {...style} fill="red" width={200} height={200} />
  );
};
