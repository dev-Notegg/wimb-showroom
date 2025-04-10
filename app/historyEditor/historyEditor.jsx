// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Transformer } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

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
  gap: "6px"
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
                rotation: node.rotation()
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

  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const applyHistory = (nextImages, nextColor = color) => {
    setImages(nextImages);
    setColor(nextColor);
    setHistory((prev) => [...prev, {
      images: deepClone(nextImages),
      color: nextColor
    }]);
    setRedoStack([]);
  };

  const handleChangeComplete = (color) => {
    const container = stageRef.current.container();
    container.style.backgroundColor = color.hex;
    applyHistory(images, color.hex); // ✅ 제대로 동작
  };

  // 로컬 이미지 파일 추가
  const fileInputOnChange = async (e) => {
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
        rotation: 0
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
    }
  };

  const undo = () => {
    if (history.length <= 1) return; // 더 이상 되돌릴 게 없음

    const prev = history[history.length - 2];   // 되돌릴 상태
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
      setHistory([{
        images: [],
        color: "#fff"
      }]);
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
        <div style={{ display: "flex", position: "absolute", zIndex: "999" }}>
          <SketchPicker color={color} onChange={handleChangeComplete} />
          <div style={{ marginLeft: 20 }}>
            <div>로컬에서 이미지 불러와 편집</div>
            <div>
              <input type="file" id="file_input" onChange={fileInputOnChange} />
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={undo} style={buttonStyle} title="되돌리기 (Ctrl+Z)">
                ⬅️ Undo
              </button>
              <button onClick={redo} style={buttonStyle} title="다시 실행 (Ctrl+Y)">
                ➡️ Redo
              </button>
            </div>
          </div>
        </div>
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
      </>
  );
};

export default App;
