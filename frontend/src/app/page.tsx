"use client";

import { GameStateProvider, useGameState } from "@/hooks/useGameState";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import ViewMenu from "@/components/views/ViewMenu";
import ViewPregame from "@/components/views/ViewPregame";
import ViewIngame from "@/components/views/ViewIngame";
import ViewInDevelopment from "@/components/views/ViewInDevelopment";

function AppContent() {
  const { view } = useGameState();

  return (
    <>
      <Header />
      {(view === "closed" || view === "menu") && <ViewMenu />}
      {view === "pregame" && <ViewPregame />}
      {view === "ingame" && <ViewIngame />}
      {view === "tierlist" && <ViewInDevelopment type="tierlist" />}
      {view === "tools" && <ViewInDevelopment type="tools" />}
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
