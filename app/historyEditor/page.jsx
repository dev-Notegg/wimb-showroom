"use client";

import dynamic from "next/dynamic";

export default function Home() {
  const NoSSRComponent = dynamic(() => import("./historyEditor"), {
    ssr: false,
  });

  return (
    <>
      <NoSSRComponent />
    </>
  );
}
