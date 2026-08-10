"use client";

import { GameStateProvider, useGameState } from "@/hooks/useGameState";
import Header from "@/components/Header";
import ViewClosed from "@/components/views/ViewClosed";
import ViewMenu from "@/components/views/ViewMenu";
import ViewPregame from "@/components/views/ViewPregame";
import ViewIngame from "@/components/views/ViewIngame";

function AppContent() {
  const { view } = useGameState();

  return (
    <>
      <Header />
      {view === "closed" && <ViewClosed />}
      {view === "menu" && <ViewMenu />}
      {view === "pregame" && <ViewPregame />}
      {view === "ingame" && <ViewIngame />}
    </>
  );
}

export default function Home() {
  return (
    <GameStateProvider>
      <AppContent />
    </GameStateProvider>
  );
}
