"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("./TestComponent6"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
