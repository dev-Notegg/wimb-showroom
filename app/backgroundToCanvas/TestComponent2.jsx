// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Image, Transformer } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

const App = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const stageRef = useRef(null);

  const [color, setColor] = useState("#000");

  const handleChangeComplete = (color) => {
    const container = stageRef.current.container();

    container.style.backgroundColor = color.hex;
    setColor(color);
  };

  // 로컬 이미지 파일 추가

  const transformerRef = useRef();
  const rectRefs = useRef(new Map());

  const [images, setImages] = useState([]);

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fileInputOnChange = async (e) => {
    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(e.target.files[0]);

    new Promise(() => {
      const img = new window.Image();

      img.src = url;

      img.onload = () => {
        const { width, height } = img;

        const size = { width, height };

        setImages([
          {
            url: url,
            id: "images",
            x: width / 2,
            y: width / 2,
            width: size.width,
            height: size.height,
          },
        ]);
      };
    });
  };

  const handleTouch = () => {
    const nodes = [{ id: "images" }].map((shape) =>
      rectRefs.current.get(shape.id)
    );

    transformerRef.current.nodes(nodes);
  };

  const handleTransformerDrag = (e) => {
    if (!transformerRef.current) return;

    const nodes = transformerRef.current.nodes();
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

  const URLImage = ({ src, ...rest }) => {
    const [image] = useImage(src, "anonymous");
    return <Image image={image} {...rest} />;
  };

  const getTotalBox = (boxes) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    boxes.forEach((box) => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  };
  return (
    <>
      <div style={{ display: "flex", position: "absolute", zIndex: "999" }}>
        <SketchPicker color={color} onChange={handleChangeComplete} />
        <div>
          <div>로컬에서 이미지 불러와 편집</div>
          <div>
            <input type="file" id="file_input" onChange={fileInputOnChange} />
          </div>
          <div id="canvas-container"></div>
        </div>
      </div>
      <Stage width={width} height={height} draggable ref={stageRef}>
        <Layer>
          {images.map((image) => (
            <URLImage
              id={image.id}
              key={image.id}
              ref={(node) => {
                if (node) {
                  rectRefs.current.set(image.id, node);
                }
              }}
              onTouchstart={handleTouch}
              src={image.url}
              x={image.x}
              y={image.y}
              width={image.width}
              height={image.height}
              draggable
            />
          ))}
          {/* Demo shape */}
          <Circle x={width / 2} y={height / 2} radius={100} fill="red" />

          <Transformer
            ref={transformerRef}
            onDragMove={handleTransformerDrag}
          />
        </Layer>
      </Stage>
    </>
  );
};

export default App;
