"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("./crop"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
