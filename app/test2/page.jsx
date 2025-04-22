"use client";

import * as React from "react";

import dynamic from "next/dynamic";

// import AppKonva from "./AppKonva";
// import AppWeb from "./AppWeb";

// window.Konva.hitOnDragEnabled = true;
// window.Konva.captureTouchEventsEnabled = true;

export default function App() {
  const NoSSRComponent = dynamic(
    () => import("../touchscaleshape/final_final"),
    {
      ssr: false,
    }
  );

  return (
    <div>
      {/* <AppKonva /> */}
      {/* <AppWeb /> */}
      <NoSSRComponent />
      {/* <PullRelease /> */}
    </div>
  );
}
