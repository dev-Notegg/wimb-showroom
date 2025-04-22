"use client";

import * as React from "react";

import dynamic from "next/dynamic";

export default function App() {
  const NoSSRComponent = dynamic(() => import("./Manager"), {
    ssr: false,
  });

  return (
    <div>
      <NoSSRComponent />
    </div>
  );
}
