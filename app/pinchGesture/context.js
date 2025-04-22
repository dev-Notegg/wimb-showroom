"use client";

import { createContext, useContext } from "react";

//----------- 스테이지 관련 Context -----------
export const StageContext = createContext();

export function StageProvider({ children }) {
  return <StageContext.Provider value={{}}>{children}</StageContext.Provider>;
}

export function useStageState() {
  const context = useContext(StageContext);

  if (context === undefined) {
    throw new Error("useStageState must be used within a StageProvider");
  }
  return context;
}

// --------- 이미지 관련 Context ------------
export const ImageContext = createContext();

export function ImageProvider({ children }) {
  const [images, setImages] = useState([]);

  return <ImageContext.Provider value={{}}>{children}</ImageContext.Provider>;
}

export function useImageState() {
  const context = useContext(ImageContext);

  if (context === undefined) {
    throw new Error("useImageState must be used within a ImageProvider");
  }
  return context;
}
