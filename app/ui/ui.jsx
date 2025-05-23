// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Transformer } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

import NextImage from "next/image";
import styled from "styled-components";

const width = window.innerWidth;
const height = window.innerHeight;

const deepClone = (arr) => arr.map((item) => ({ ...item }));

const buttonStyle = {
  padding: "8px 16px",
  fontSize: "14px",
  backgroundColor: "#f0f0f0",
  border: "1px solid #ccc",
  borderRadius: "4px",
  marginRight: "8px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

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

  useEffect(() => {
    if (isSelected) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current]);
    }
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Image
        image={image}
        onClick={onSelect}
        onTap={onSelect}
        ref={shapeRef}
        {...shapeProps}
        draggable={isSelected}
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
      {isSelected && (
        <Transformer
          ref={trRef}
          flipEnabled={false}
          boundBoxFunc={(oldBox, newBox) => {
            // limit resize
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
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

      const newImage = {
        url: url,
        id: Math.floor(Math.random() * 9999) + 1,
        x: width / 2 / 2,
        y: height / 2 / 2,
        width,
        height,
        rotation: 0,
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

  //이미지 저장
  const handleExport = () => {
    const stage = stageRef.current;
    if (!stage) return;

    // 현재 보이는 모든 Transformer 잠시 숨기기
    const transformers = stage.find("Transformer");
    transformers.forEach((tr) => tr.hide());
    stage.draw(); // 즉시 리렌더링

    // 이미지(Transformer 제외)만 DataURL로 추출
    const uri = stage.toDataURL({ pixelRatio: 2 });

    // 파일로 저장
    const link = document.createElement("a");
    link.download = "canvas-export.png";
    link.href = uri;
    link.click();

    // Transformer 다시 보이게
    transformers.forEach((tr) => tr.show());
    stage.draw();
  };

  // 앞으로가기 뒤로가기
  const bringToFront = () => {
    const idx = images.findIndex((img) => img.id === selectedId);
    if (idx === -1 || idx === images.length - 1) return; // 이미 최상위
    const newImages = [...images];
    [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]]; // swap
    applyHistory(newImages);
  };

  const sendToBack = () => {
    const idx = images.findIndex((img) => img.id === selectedId);
    if (idx <= 0) return; // 이미 최하위
    const newImages = [...images];
    [newImages[idx - 1], newImages[idx]] = [newImages[idx], newImages[idx - 1]]; // swap
    applyHistory(newImages);
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
          <button onClick={handleExport} title="이미지 저장">
            <NextImage
              src={"./images/save.png"}
              width={25}
              height={25}
              alt="redo-icon"
            />
          </button>
          {selectedId && (
            <>
              <button title="인덱스 하나 앞으로 이동" onClick={bringToFront}>
                <NextImage
                  src={"./images/foward.png"}
                  width={25}
                  height={25}
                  alt="redo-icon"
                />
              </button>
              <button
                title="인덱스 하나 뒤로 이동"
                onClick={sendToBack}
                style={{ marginLeft: 10 }}
              >
                <NextImage
                  src={"./images/backward.png"}
                  width={25}
                  height={25}
                  alt="redo-icon"
                />
              </button>
            </>
          )}
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
