"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("../app/save/SavePoint2"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
