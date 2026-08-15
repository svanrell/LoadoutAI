"use client";

import { GameStateProvider, useGameState } from "@/hooks/useGameState";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import ViewMenu from "@/components/views/ViewMenu";
import ViewPregame from "@/components/views/ViewPregame";
import ViewIngame from "@/components/views/ViewIngame";

function AppContent() {
  const { view } = useGameState();

  return (
    <>
      <Header />
      {(view === "closed" || view === "menu") && <ViewMenu />}
      {view === "pregame" && <ViewPregame />}
      {view === "ingame" && <ViewIngame />}
    </>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <GameStateProvider>
        <AppContent />
      </GameStateProvider>
    </LanguageProvider>
  );
}
