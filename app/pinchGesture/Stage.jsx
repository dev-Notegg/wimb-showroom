"use client";

import { Stage as KonvaStage } from "react-konva";
import useStageStore from "@/store/useStageStore";
import { useEffect } from "react";

export function Stage({ children }) {
  const { width, height, color, stageRef } = useStageStore();

  useEffect(() => {
    const container = stageRef?.current?.container();
    if (container) {
      container.style.backgroundColor = color;
    }
  }, [color]);

  return (
    <KonvaStage width={width} height={height} ref={stageRef}>
      {children}
    </KonvaStage>
  );
}
