import { create } from "zustand";

const useStageStore = create((get, set) => ({
  width: window.innerWidth,
  height: window.innerHeight,
  stageRef: null,
}));

export default useStageStore;
