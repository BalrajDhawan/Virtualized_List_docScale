"use client";

import React, { useState } from "react";
import { DocumentViewer } from "../components/DocumentViewer/DocumentViewer";
import { Header } from "../components/Header/Header";

export default function Home() {
  const [pageCount, setPageCount] = useState<number>(0);

  return (
    <div className="flex flex-col flex-1 items-center justify-start min-h-screen py-5 bg-zinc-100 font-sans dark:bg-zinc-900 dark:text-zinc-100">
      
      <Header pageCount={pageCount} setPageCount={setPageCount} />

      {/* RENDER BOUNDARY */}
      <DocumentViewer pageCount={pageCount} />

    </div>
  );
}