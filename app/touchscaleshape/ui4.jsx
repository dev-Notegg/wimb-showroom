import React, { useEffect, useRef } from "react";
// import { useSpring, animated } from "@react-spring/web";
import { createUseGesture, dragAction, pinchAction } from "@use-gesture/react";

import { animated, useSpring } from "@react-spring/konva";

import styles from "./styles.module.css";
import { Layer, Stage } from "react-konva";

const width = window.innerWidth;
const height = window.innerHeight;

const useGesture = createUseGesture([dragAction, pinchAction]);

export default function App() {
  useEffect(() => {
    const handler = (e) => e.preventDefault();
    document.addEventListener("gesturestart", handler);
    document.addEventListener("gesturechange", handler);
    document.addEventListener("gestureend", handler);
    return () => {
      document.removeEventListener("gesturestart", handler);
      document.removeEventListener("gesturechange", handler);
      document.removeEventListener("gestureend", handler);
    };
  }, []);

  const [style, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }));
  const ref = useRef(null);

  useGesture(
    {
      // onHover: ({ active, event }) => console.log('hover', event, active),
      // onMove: ({ event }) => console.log('move', event),
      onDrag: ({ pinching, cancel, offset: [x, y], ...rest }) => {
        if (pinching) return cancel();
        api.start({ x, y });
      },
      onPinch: ({
        origin: [ox, oy],
        first,
        movement: [ms],
        offset: [s, a],
        memo,
      }) => {
        if (first) {
          const { width, height, x, y } = ref.current?.getClientRect();
          console.log(
            "ref.current?.getClientRect()",
            ref.current?.getClientRect()
          );

          const tx = ox - (x + width / 2);
          const ty = oy - (y + height / 2);
          memo = [style.x.get(), style.y.get(), tx, ty];
        }

        const x = memo[0] - (ms - 1) * memo[2];
        const y = memo[1] - (ms - 1) * memo[3];
        api.start({ scale: { x: s, y: s }, rotation: a, immediate: true });
        return memo;
      },
    },
    {
      target: ref,
      drag: { from: () => [style.x.get(), style.y.get()] },
      pinch: { scaleBounds: { min: 0.5, max: 2 }, rubberband: true },
    }
  );

  return (
    <>
      <div className={`flex fill center ${styles.container}`}>
        <Stage width={width} height={height}>
          <Layer>
            <animated.Rect
              fill={"yellow"}
              width={300}
              height={300}
              className={styles.card}
              ref={ref}
              style={style}
            ></animated.Rect>
          </Layer>
        </Stage>
      </div>
    </>
  );
}
