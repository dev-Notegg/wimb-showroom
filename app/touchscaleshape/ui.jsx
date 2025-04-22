// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Transformer, Rect } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

import NextImage from "next/image";
import styled from "styled-components";
import css from "styled-jsx/css";

import { RectNode } from "../test2/AppKonva";

import { useGesture } from "@use-gesture/react";
import { animated, useSpring } from "@react-spring/konva";

const width = window.innerWidth;
const height = window.innerHeight;

window.Konva.hitOnDragEnabled = true;
window.Konva.captureTouchEventsEnabled = true;

const deepClone = (arr) => arr.map((item) => ({ ...item }));

const ImageRectangle = ({
  src,
  shapeProps,
  isSelected,
  onSelect,
  onChange,
}) => {
  const [image] = useImage(src, "anonymous");

  const shapeRef = useRef();
  const trRef = useRef();

  console.log("shpeProps", shapeProps);

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

  const ref = useRef(null);

  useGesture(
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
      drag: {
        pointer: { capture: false, touch: true },
      },
      pinch: {
        pointer: { touch: true, capture: false },
        // scaleBounds: { min: 0.5, max: 2 },
        rubberband: true,
      },
      target: ref,
    }
  );

  return (
    <>
      <animated.Image
        image={image}
        // onClick={onSelect}
        // onTap={onSelect}
        ref={ref}
        {...style}
        width={shapeProps.width}
        height={shapeProps.height}
        // {...shapeProps}
        onDragEnd={(e) => {
          onChange({
            ...shapeProps,
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          // transformer is changing scale of the node
          // and NOT its width or height
          // but in the store we have only width and height
          // to match the data better we will reset scale on transform end
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          // we will reset it back
          node.scaleX(1);
          node.scaleY(1);
          onChange({
            ...shapeProps,
            x: node.x(),
            y: node.y(),
            // set minimal value
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(node.height() * scaleY),
            rotation: node.rotation(),
          });
        }}
      />
    </>
  );
};

const App = () => {
  const stageRef = useRef(null);

  const [images, setImages] = useState([]);
  const [selectedId, selectShape] = useState(null);

  const [color, setColor] = useState("#fff");
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

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
    applyHistory(images, color.hex); // ✅ 제대로 동작
  };

  // 로컬 이미지 파일 추가
  const fileInputOnChange = async (e) => {
    if (!e.target.files[0]) return;

    const URL = window.webkitURL || window.URL;
    const url = URL.createObjectURL(e.target.files[0]);
    const img = new window.Image();
    img.src = url;

    img.onload = () => {
      const { width, height } = img;

      // get the aperture we need to fit by taking padding off the stage size.
      var targetW = stageRef.current.getWidth() - 2;
      var targetH = stageRef.current.getHeight() - 2;

      // compute the ratios of image dimensions to aperture dimensions
      var widthFit = targetW / width;
      var heightFit = targetH / height;

      // compute a scale for best fit and apply it
      var scale = widthFit > heightFit ? heightFit : widthFit;

      var fitW = parseInt(width * scale, 10);
      var fitH = parseInt(height * scale, 10);

      const newImage = {
        url: url,
        id: Math.floor(Math.random() * 9999) + 1,
        x: stageRef.current.width() / 4,
        y: stageRef.current.height() / 4,
        width: fitW,
        height: fitH,
        // rotation: 0,
      };

      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      applyHistory(updatedImages);
    };
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

  const undo = () => {
    if (history.length <= 1) return; // 더 이상 되돌릴 게 없음

    const prev = history[history.length - 2]; // 되돌릴 상태
    const current = history[history.length - 1]; // 현재 상태

    setImages(prev.images);
    setColor(prev.color);

    setHistory((prevList) => prevList.slice(0, -1)); // 마지막 하나 제거
    setRedoStack((prevList) => [...prevList, current]); // 현재 상태를 redo에 추가
    selectShape(null);
  };

  const redo = () => {
    if (redoStack.length === 0) return;

    const next = redoStack[redoStack.length - 1];

    // Redo 상태 적용
    setImages(next.images);
    setColor(next.color);

    // history에 추가하고, redoStack에서 제거
    setHistory((prevList) => [...prevList, next]);
    setRedoStack((prevList) => prevList.slice(0, -1));
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

  useEffect(() => {
    const container = stageRef.current?.container();
    if (container) {
      container.style.backgroundColor = color;
    }
  }, [color]);

  return (
    <>
      <Stage
        width={width}
        height={height}
        ref={stageRef}
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
      >
        <Layer>
          {/* <animated.Rect
            ref={ref}
            {...style}
            fill="yellow"
            width={200}
            height={200}
          /> */}
          <RectNode />
          {images.map((image, i) => {
            return (
              <ImageRectangle
                key={i}
                src={image.url}
                shapeProps={image}
                isSelected={image.id === selectedId}
                onSelect={() => {
                  selectShape(image.id);
                }}
                onChange={(newAttrs) => {
                  const rects = images.slice();
                  rects[i] = newAttrs;
                  applyHistory(rects);
                  console.log("rects", rects);
                }}
              />
            );
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

const ToolBarContainer = styled.div`
  position: absolute;

  display: flex;
  column-gap: 24px;

  left: 50%;
  bottom: 0;
  transform: translate(-50%, -50%);

  padding: 14px 31px;
  border-radius: 80px;
  background-color: rgba(0, 0, 0, 0.5);
`;

const InputFile = styled.input`
  position: absolute;
  width: 0;
  height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
`;

const InputFileLabel = styled.label`
  cursor: pointer;
`;

const ColorPickerContainer = styled.div`
  position: absolute;
  z-index: 999;

  bottom: 0;
  left: 50%;
  transform: translate(-50%, -30%);
`;
