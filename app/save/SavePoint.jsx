import { Stage, Layer, Rect, Transformer, Image } from "react-konva";
import { useState, useRef } from "react";

import useImage from "use-image";

const App = () => {
  const [images, setImages] = useState([]);

  const transformerRef = useRef();
  const rectRefs = useRef(new Map());

  const stageRef = useRef();

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
            x: 0,
            y: 0,
            width: size.width,
            height: size.height,
          },
        ]);
      };
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

  const [stageSize, setStageSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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

  const handleTouch = () => {
    const nodes = [{ id: "images" }].map((shape) =>
      rectRefs.current.get(shape.id)
    );

    transformerRef.current.nodes(nodes);
  };

  return (
    <>
      <div>로컬에서 이미지 불러와 편집</div>
      <div>
        <input type="file" id="file_input" onChange={fileInputOnChange} />
      </div>
      <div id="canvas-container"></div>

      <Stage
        width={window.innerWidth}
        height={window.innerHeight}
        ref={stageRef}
      >
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
