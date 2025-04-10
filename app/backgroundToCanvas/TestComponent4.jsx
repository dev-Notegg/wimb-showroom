// 아무것도 아닌듯

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
        const { width, height, ...rest } = img;

        const size = { width, height };

        setImages([
          ...images,
          {
            url: url,
            id: Math.floor(Math.random() * 9999) + 1,
            x: width / 2 / 2,
            y: width / 2 / 2,
            width: size.width,
            height: size.height,
          },
        ]);
      };
    });
  };

  const handleTouch = (id) => {
    console.log("id", id);
    const nodes = [{ id: id }].map((shape) => rectRefs.current.get(shape.id));

    transformerRef.current.nodes(nodes);
  };

  const URLImage = ({ src, isSelected, id, ...rest }) => {
    const [image] = useImage(src, "anonymous");

    return (
      <>
        <Image
          {...rest}
          id={id}
          image={image}
          onDragEnd={(e) => {
            const slicedArr = images.map((data, idx) => {
              if (data.id === id) {
                return {
                  url: src,
                  id: id,
                  x: e.target.x(),
                  y: e.target.y(),
                };
              }
              return data;
            });

            console.log("onDragEnd", slicedArr);
            console.log("onDragEnd transformerRef", transformerRef.current);

            setImages(slicedArr);
          }}
          onTransformEnd={(e) => {
            const node = rectRefs.current.get(id);
            console.log("node", node);

            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            // we will reset it back
            node.scaleX(1);
            node.scaleY(1);

            const slicedArr = images.map((data, idx) => {
              if (data.id === id) {
                return {
                  url: src,
                  id: id,
                  x: node.x(),
                  y: node.y(),
                  width: Math.max(5, node.width() * scaleX),
                  height: Math.max(node.height() * scaleY),
                };
              }
              return data;
            });

            setImages(slicedArr);
          }}
        />
        {console.log("isSelected", isSelected)}
        {isSelected && (
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // limit resize
              if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
                return oldBox;
              }
              return newBox;
            }}
            // onDragMove={handleTransformerDrag}
          />
        )}
      </>
    );
  };

  // transformer 터치이벤트 받기

  const [selectedId, selectShape] = useState(null);

  const checkDeselect = (e) => {
    // deselect when clicked on empty area
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      selectShape(null);
    }
  };

  useEffect(() => {
    if (selectedId) {
      // we need to attach transformer manually
      console.log("selectedIdselectedIdselectedId", selectedId);

      handleTouch(selectedId);
    }
  }, [selectedId]);

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
        onTouchStart={checkDeselect}
      >
        <Layer>
          {images.map((image) => {
            return (
              <URLImage
                id={image.id}
                key={image.id}
                ref={(node) => {
                  if (node) {
                    rectRefs.current.set(image.id, node);
                  }
                }}
                onMouseDown={() => {
                  // handleTouch(image.id);
                  selectShape(image.id);
                }}
                onTouchstart={() => {
                  // handleTouch(image.id);
                  selectShape(image.id);
                }}
                isSelected={image.id === selectedId}
                onSelect={() => {
                  selectShape(image.id);
                }}
                src={image.url}
                x={image.x}
                y={image.y}
                width={image.width}
                height={image.height}
                draggable
              />
            );
          })}
          {/* Demo shape */}
          <Circle x={width / 2} y={height / 2} radius={100} fill="red" />
        </Layer>
      </Stage>
    </>
  );
};

export default App;
