"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("./guidesAndForward"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
