// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리
// 4. undo, redo 기능
// 5. 가이드라인 기능
// 6. 이미지 앞으로 보내는 기능
// 7. 핀치 제스처 추가

import { useState, useRef, useEffect } from "react";
import { Layer, Transformer, Line } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

import NextImage from "next/image";
import styled from "styled-components";

import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/konva";
import { InputFile, InputFileLabel, ToolBarContainer } from "../style";
import { Stage } from "./Stage";
import useStageStore from "@/store/useStageStore";
import { Image } from "./Image";
import useStore from "@/store/useStore";

const deepClone = (arr) => arr.map((item) => ({ ...item }));

const GUIDELINE_OFFSET = 5;

const ImageRectangle = ({
  src,
  shapeProps,
  onChange,
  onDragMove,
  onDragEnd,
  undoRedoState,
}) => {
  const [image] = useImage(src, "anonymous");

  const shapeRef = useRef();

  const [style, api] = useSpring(() => ({
    width: shapeProps.width,
    height: shapeProps.height,
    x: shapeProps.width / 2,
    y: shapeProps.height / 2,
    offsetX: shapeProps.width / 2,
    offsetY: shapeProps.height / 2,
  }));

  useGesture(
    {
      onDrag: ({ pinching, cancel, offset: [x, y] }) => {
        if (pinching) return cancel();
        api.start({
          x,
          y,
          immediate: true,
        });
        onDragMove("", shapeRef.current);
      },
      onPinch: ({ offset: [s, a] }) => {
        api.start({
          scale: { x: s, y: s },
          rotation: a,
        });
      },
      onPinchEnd: ({ offset: [s, a] }) => {
        onChange({
          ...shapeProps,
          scale: { x: s, y: s },
          rotation: a,
        });
      },
      onDragEnd: ({ offset: [x, y] }) => {
        onChange({
          ...shapeProps,
          x: style.x.get(),
          y: style.y.get(),
        });
        if (onDragEnd) {
          onDragEnd();
        }
      },
    },
    {
      drag: {
        pointer: { capture: false, touch: true },
        from: () => [style.x.get(), style.y.get()],
      },
      pinch: {
        pointer: { touch: true, capture: false },
      },
      target: shapeRef,
    }
  );

  useEffect(() => {
    if (undoRedoState && shapeProps) {
      api.start({
        width: shapeProps.width,
        height: shapeProps.height,
        x: shapeProps.x,
        y: shapeProps.y,
        offsetX: shapeProps.offsetX,
        offsetY: shapeProps.offsetY,
        scale: shapeProps.scale,
        rotation: shapeProps.rotation,
        immediate: true,
      });
    }
  }, [undoRedoState]);

  return (
    <>
      <animated.Image
        name="object" // 가이드라인 기능에서 사용하기 위한 객체명 설정
        image={image}
        ref={shapeRef}
        {...style}
      />
    </>
  );
};

const App = () => {
  const stageRef = useRef(null);

  const [selectedId, selectShape] = useState(null);

  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const [undoRedoState, setUndoRedoState] = useState(0);

  // 가이드라인 상태 추가
  const [guidelines, setGuidelines] = useState([]);

  const { color, setColor } = useStageStore();

  const { fileInputOnChange, undo, redo } = useStore();

  const applyHistory = (nextImages, nextColor = color) => {
    setImages(nextImages);
    setColor(nextColor);
    setHistory((prev) => [
      ...prev,
      {
        images: deepClone(nextImages),
        color: nextColor,
      },
    ]);
    setRedoStack([]);
  };

  const handleChangeComplete = (color) => {
    const container = stageRef.current.container();
    container.style.backgroundColor = color.hex;
    applyHistory(images, color.hex);
  };

  // transformer 터치이벤트 받기

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
      setColorPickerOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        redo(); // Ctrl+Y로 다시 실행
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, redoStack]);

  useEffect(() => {
    if (history.length === 0) {
      setHistory([
        {
          images: [],
          color: "#fff",
        },
      ]);
    }
  }, []);

  // 가이드라인 관련 헬퍼 함수들
  const getLineGuideStops = (skipShape) => {
    const stage = stageRef.current;
    const vertical = [0, stage.width() / 2, stage.width()];
    const horizontal = [0, stage.height() / 2, stage.height()];

    stage.find(".object").forEach((guideItem) => {
      if (guideItem === skipShape) return;

      const box = guideItem.getClientRect({ skipStroke: true });
      vertical.push(box.x, box.x + box.width, box.x + box.width / 2);
      horizontal.push(box.y, box.y + box.height, box.y + box.height / 2);
    });

    return { vertical, horizontal };
  };

  const getObjectSnappingEdges = (node) => {
    const box = node.getClientRect({ skipStroke: true });
    const absPos = node.absolutePosition();

    return {
      vertical: [
        {
          guide: box.x,
          offset: absPos.x - box.x,
          snap: "start",
        },
        {
          guide: box.x + box.width / 2,
          offset: absPos.x - (box.x + box.width / 2),
          snap: "center",
        },
        {
          guide: box.x + box.width,
          offset: absPos.x - (box.x + box.width),
          snap: "end",
        },
      ],
      horizontal: [
        {
          guide: box.y,
          offset: absPos.y - box.y,
          snap: "start",
        },
        {
          guide: box.y + box.height / 2,
          offset: absPos.y - (box.y + box.height / 2),
          snap: "center",
        },
        {
          guide: box.y + box.height,
          offset: absPos.y - (box.y + box.height),
          snap: "end",
        },
      ],
    };
  };

  const getGuides = (lineGuideStops, itemBounds) => {
    let resultV = [];
    let resultH = [];

    lineGuideStops.vertical.forEach((lineGuide) => {
      itemBounds.vertical.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        // if the distance between guild line and object snap point is close we can consider this for snapping
        if (diff < GUIDELINE_OFFSET) {
          resultV.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    lineGuideStops.horizontal.forEach((lineGuide) => {
      itemBounds.horizontal.forEach((itemBound) => {
        const diff = Math.abs(lineGuide - itemBound.guide);
        if (diff < GUIDELINE_OFFSET) {
          resultH.push({
            lineGuide: lineGuide,
            diff: diff,
            snap: itemBound.snap,
            offset: itemBound.offset,
          });
        }
      });
    });

    const guides = [];

    const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
    const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
    if (minV) {
      guides.push({
        lineGuide: minV.lineGuide,
        offset: minV.offset,
        orientation: "V",
        snap: minV.snap,
      });
    }
    if (minH) {
      guides.push({
        lineGuide: minH.lineGuide,
        offset: minH.offset,
        orientation: "H",
        snap: minH.snap,
      });
    }
    return guides;
  };

  // 가이드라인 스냅 기능을 위한 드래그 무브 핸들러
  const handleDragMove = (e, node) => {
    // 기존 가이드라인 라인 제거 (state 초기화)
    setGuidelines([]);
    const lineGuideStops = getLineGuideStops(node);
    const itemBounds = getObjectSnappingEdges(node);
    const guides = getGuides(lineGuideStops, itemBounds);

    if (guides.length) {
      let absPos = node.absolutePosition();
      guides.forEach((lg) => {
        switch (lg.orientation) {
          case "V": {
            absPos.x = lg.lineGuide + lg.offset;
            break;
          }
          case "H": {
            absPos.y = lg.lineGuide + lg.offset;
            break;
          }
        }
      });
      node.absolutePosition(absPos);
    }
    setGuidelines(guides);
  };

  // 드래그 종료 시 가이드라인 클리어
  const handleDragEnd = () => {
    setGuidelines([]);
  };

  return (
    <>
      <Stage ref={stageRef}>
        <Layer>
          <Image />
          {/* {images.map((image, i) => {
            return (
              <ImageRectangle
                key={i}
                src={image.url}
                shapeProps={image}
                undoRedoState={undoRedoState}
                // onSelect={() => {
                //   selectShape(image.id);
                // }}
                onChange={(newAttrs) => {
                  const rects = images.slice();
                  rects[i] = newAttrs;
                  applyHistory(rects);
                }}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            );
          })} */}
        </Layer>
        <Layer>
          {guidelines.map((guide, index) => {
            if (guide.orientation === "H") {
              return (
                <Line
                  key={index}
                  points={[-6000, guide.lineGuide, 6000, guide.lineGuide]}
                  stroke="rgb(0, 161, 255)"
                  strokeWidth={1}
                  dash={[4, 6]}
                />
              );
            } else if (guide.orientation === "V") {
              return (
                <Line
                  key={index}
                  points={[guide.lineGuide, -6000, guide.lineGuide, 6000]}
                  stroke="rgb(0, 161, 255)"
                  strokeWidth={1}
                  dash={[4, 6]}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>

      {colorPickerOpen && (
        <ColorPickerContainer>
          <SketchPicker color={color} onChange={handleChangeComplete} />
        </ColorPickerContainer>
      )}

      <div className="text-center">
        <ToolBarContainer>
          <button
            onClick={() => setColorPickerOpen(!colorPickerOpen)}
            title="배경색 선택"
          >
            <NextImage
              src={"./images/color-picker-icon.png"}
              width={25}
              height={25}
              alt="background-color-picker-icon"
            />
          </button>

          <InputFileLabel title="이미지 추가">
            <InputFile
              type="file"
              id="file_input"
              onChange={fileInputOnChange}
            />
            <NextImage
              src={"./images/image-square.png"}
              width={25}
              height={25}
              alt="import-image-icon"
            />
          </InputFileLabel>

          <InputFileLabel title="이미지 추가">
            <InputFile
              type="file"
              id="file_input"
              onChange={fileInputOnChange}
            />
            <NextImage
              src={"./images/plus.png"}
              width={25}
              height={25}
              alt="plus-icon"
            />
          </InputFileLabel>

          <button onClick={undo} title="되돌리기 (Ctrl+Z)">
            <NextImage
              src={"./images/arrow-u-down-undo.png"}
              width={25}
              height={25}
              alt="undo-icon"
            />
          </button>
          <button onClick={redo} title="다시 실행 (Ctrl+Y)">
            <NextImage
              src={"./images/arrow-u-down-redo.png"}
              width={25}
              height={25}
              alt="redo-icon"
            />
          </button>
        </ToolBarContainer>
      </div>
    </>
  );
};

export default App;
