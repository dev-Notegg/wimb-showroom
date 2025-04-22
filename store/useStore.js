import { create } from "zustand";

import useStageStore from "@/store/useStageStore";

const useStore = create((get, set) => ({
  color: "#fff",

  images: [],

  history: [],
  redoStack: [],
  undoRedoState: 0,

  setImages: (newImage) => {
    set({ images: newImage });
  },

  setColor: (color) => {
    set({ color: color });
  },

  setUndoRedoState: () => {
    set({ undoRedoState: get().undoRedoState + 1 });
  },

  setRedoStack: (redoStack) => {
    set({ redoStack: redoStack });
  },

  applyHistory: (nextImages, nextColor = color) => {
    const {
      setImages,
      setColor,
      history,
      setHistory,
      setRedoStack,
      setUndoRedoState,
    } = get();

    setImages(nextImages);
    setColor(nextColor);
    setHistory((prev) => [
      ...history,
      {
        images: deepClone(nextImages),
        color: nextColor,
      },
    ]);
    setRedoStack([]);
  },
  undo: () => {
    const {
      history,
      setImages,
      setColor,
      setHistory,
      setRedoStack,
      setUndoRedoState,
    } = get();

    console.log("history", history);

    if (history.length <= 1) return; // 더 이상 되돌릴 게 없음

    const prev = history[history.length - 2]; // 되돌릴 상태
    const current = history[history.length - 1]; // 현재 상태

    setImages(prev.images);
    setColor(prev.color);

    setHistory((prevList) => prevList.slice(0, -1)); // 마지막 하나 제거
    setRedoStack([...get().prevList, current]); // 현재 상태를 redo에 추가
    setUndoRedoState();
  },
  redo: () => {
    const {
      redoStack,
      setImages,
      setColor,
      setHistory,
      setRedoStack,
      setUndoRedoState,
    } = get();

    if (redoStack.length === 0) return;

    const next = get().redoStack[redoStack.length - 1];

    // Redo 상태 적용
    setImages(next.images);
    setColor(next.color);

    // history에 추가하고, redoStack에서 제거
    setHistory((prevList) => [...prevList, next]);
    setRedoStack((prevList) => prevList.slice(0, -1));
    setUndoRedoState();
  },
  handleChangeComplete: (color) => {
    const { applyHistory } = get();
    const { stageRef } = useStageStore.getState();

    const container = stageRef.container();
    container.style.backgroundColor = color.hex;
    applyHistory(images, color.hex);
  },

  // 로컬 이미지 파일 추가
  fileInputOnChange: async (e) => {
    if (!e.target.files[0]) return;

    const { images, setImages, applyHistory } = get();
    const { stageRef } = useStageStore.getState();

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
        offsetX: stageRef.current.width() / 2,
        offsetY: stageRef.current.height() / 2,
        scale: { x: 1, y: 1 },
        rotation: 0,
      };

      const updatedImages = [...images, newImage];
      setImages(updatedImages);
      applyHistory(updatedImages);
    };
  },
}));

export default useStore;
