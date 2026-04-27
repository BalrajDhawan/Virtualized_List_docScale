"use client";

import React, { useState, useMemo } from "react";
import { DocumentViewer } from "../components/DocumentViewer/DocumentViewer";
import { Header } from "../components/Header/Header";
import { useMultiplayerSimulation } from "../hooks/useMultiplayerSimulation";

export default function Home() {
  const [pageCount, setPageCount] = useState<number>(0);

  const showDebug = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return new URLSearchParams(window.location.search).get('debug') === '1';
  }, []);

  useMultiplayerSimulation(pageCount > 0);

  return (
    <div className="flex flex-col flex-1 items-center justify-start min-h-screen py-5 bg-zinc-100 font-sans dark:bg-zinc-900 dark:text-zinc-100">

      <Header pageCount={pageCount} setPageCount={setPageCount} />

      <DocumentViewer pageCount={pageCount} showDebug={showDebug} />

    </div>
  );
}
