// 1. 배경색 변경
// 2. 로컬 이미지 불러오기
// 3. transform 테두리

import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image, Transformer } from "react-konva";

import { SketchPicker } from "react-color";
import useImage from "use-image";

const width = window.innerWidth;
const height = window.innerHeight;

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

  const [color, setColor] = useState("#000");

  const handleChangeComplete = (color) => {
    const container = stageRef.current.container();

    container.style.backgroundColor = color.hex;
    setColor(color);
  };

  // 로컬 이미지 파일 추가

  const fileInputOnChange = async (e) => {
    var URL = window.webkitURL || window.URL;
    var url = URL.createObjectURL(e.target.files[0]);

    new Promise(() => {
      const img = new window.Image();

      img.src = url;

      img.onload = () => {
        const { width, height, ...rest } = img;

        const size = { width, height };

        setImages([
          ...images,
          {
            url: url,
            id: Math.floor(Math.random() * 9999) + 1,
            x: width / 2 / 2,
            y: height / 2 / 2,
            width: size.width,
            height: size.height,
          },
        ]);
      };
    });
  };

  // transformer 터치이벤트 받기

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
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
                  setImages(rects);
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
