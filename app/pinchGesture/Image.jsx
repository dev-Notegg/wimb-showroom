"use client";

import { Image as KonvaImage } from "react-konva";
import useStore from "@/store/useStore";

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

export function Image({ children, ref }) {
  const { images, setImages, undoRedoState } = useStore();

  return (
    <KonvaImage>
      {images.map((image, i) => {
        return (
          <ImageRectangle
            key={i}
            src={image.url}
            shapeProps={image}
            undoRedoState={undoRedoState}
            onChange={(newAttrs) => {
              const rects = images.slice();
              rects[i] = newAttrs;
              applyHistory(rects);
            }}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          />
        );
      })}
      {children}
    </KonvaImage>
  );
}
