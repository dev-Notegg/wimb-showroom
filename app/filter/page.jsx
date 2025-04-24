"use client";

import dynamic from "next/dynamic";

export default function Home() {
    const NoSSRComponent = dynamic(() => import("./filter"), {
        ssr: false,
    });

    return (
        <>
            <NoSSRComponent />
        </>
    );
}
