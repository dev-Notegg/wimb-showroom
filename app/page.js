"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("../app/ui/ui"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
