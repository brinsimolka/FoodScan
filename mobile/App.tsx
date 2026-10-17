import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import HistoryScreen from "./screens/HistoryScreen";
import ScanScreen from "./screens/ScanScreen";
import ResultScreen from "./screens/ResultScreen";
import { loadToken, setToken, setOnUnauthorized } from "./services/api";
import { fetchMe } from "./services/nutritionApi";
import { I18nProvider } from "./i18n";
import type { ScanResult, User } from "./types/nutrition";

type Screen = "home" | "scan" | "result" | "history";

export default function App() {
  return <I18nProvider><Root /></I18nProvider>;
}

function Root() {
  const [user, setUser] = useState<User | null>(null);
  const [booting, setBooting] = useState(true);
  const [screen, setScreen] = useState<Screen>("home");
  const [result, setResult] = useState<ScanResult | null>(null);

  const logout = async () => {
    await setToken(null);
    setUser(null);
    setScreen("home");
  };

  useEffect(() => {
    setOnUnauthorized(() => { logout(); });
    (async () => {
      try {
        if (await loadToken()) setUser(await fetchMe());
      } catch {
        /* token invalide ou serveur injoignable : retour à la connexion */
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  if (booting) return <View style={{ flex: 1, justifyContent: "center" }}><ActivityIndicator /></View>;

  return (
    <>
      <StatusBar style="auto" />
      {!user && <AuthScreen onAuth={(u) => { setUser(u); setScreen("home"); }} />}
      {user && screen === "home" && (
        <HomeScreen
          user={user}
          onUser={setUser}
          onScan={() => setScreen("scan")}
          onHistory={() => setScreen("history")}
          onLogout={logout}
        />
      )}
      {user && screen === "history" && <HistoryScreen onBack={() => setScreen("home")} />}
      {user && screen === "scan" && (
        <ScanScreen
          onResult={(r) => { setResult(r); setScreen("result"); }}
          onCancel={() => setScreen("home")}
        />
      )}
      {user && screen === "result" && result && (
        <ResultScreen result={result} onDone={() => setScreen("home")} />
      )}
    </>
  );
}
