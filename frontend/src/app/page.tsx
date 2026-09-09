"use client";

import { GameStateProvider, useGameState } from "@/hooks/useGameState";
import { LanguageProvider } from "@/context/LanguageContext";
import Header from "@/components/Header";
import ViewMenu from "@/components/views/ViewMenu";
import ViewPregame from "@/components/views/ViewPregame";
import ViewIngame from "@/components/views/ViewIngame";
import ViewInDevelopment from "@/components/views/ViewInDevelopment";
import ViewCrosshairs from "@/components/views/ViewCrosshairs";
import ViewLineups from "@/components/views/ViewLineups";

function AppContent() {
  const { view } = useGameState();

  return (
    <>
      <Header />
      {(view === "closed" || view === "menu") && <ViewMenu />}
      {view === "pregame" && <ViewPregame />}
      {view === "ingame" && <ViewIngame />}
      {(view === "crosshairs" || view === "tierlist") && <ViewCrosshairs />}
      {(view === "lineups" || view === "tools") && <ViewLineups />}
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
