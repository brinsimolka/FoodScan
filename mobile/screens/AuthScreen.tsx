import React, { useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { login, register } from "../services/nutritionApi";
import { useI18n, type Key } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Avatar from "../components/Avatar";
import { pickPhoto } from "../components/pickPhoto";
import { C, shadow } from "../theme";
import type { User } from "../types/nutrition";

type Mode = "login" | "register";

const ERRORS: Record<string, Key> = {
  INVALID_CREDENTIALS: "errCreds",
  EMAIL_TAKEN: "errTaken",
  PASSWORD_TOO_SHORT: "errShort",
  INVALID_INPUT: "errInput",
};

export default function AuthScreen({ onAuth }: { onAuth: (u: User) => void }) {
  const { t, ta } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const go = (m: Mode) => { setMode(m); setError(""); };

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      if (mode === "login") onAuth(await login(email, password));
      else onAuth(await register(name, email, password, photo));
    } catch (e: any) {
      const key = ERRORS[e?.response?.data?.error];
      setError(key ? t(key) : e?.response ? t("errGeneric") : t("errServer"));
    } finally {
      setBusy(false);
    }
  };

  const title = mode === "login" ? t("login") : t("signup");
  const btn = mode === "login" ? t("loginBtn") : t("signupBtn");
  const input = [s.input, { textAlign: ta }];

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logo}><Text style={s.logoEmoji}>🥗</Text></View>
        <Text style={s.brand}>FoodScan</Text>
        <View style={{ marginVertical: 14 }}><LangSwitcher /></View>

        <View style={s.card}>
          <Text style={[s.title, { textAlign: ta }]}>{title}</Text>

          {mode === "register" && (
            <View style={s.photoRow}>
              <TouchableOpacity onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }}>
                <Avatar photo={photo} name={name} size={84} />
              </TouchableOpacity>
              <Text style={s.photoHint}>{t("profilePhoto")}</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                <TouchableOpacity onPress={async () => { const p = await pickPhoto(); if (p) setPhoto(p); }}>
                  <Text style={s.link}>{photo ? t("changePhoto") : t("addPhoto")}</Text>
                </TouchableOpacity>
                {!!photo && (
                  <TouchableOpacity onPress={() => setPhoto(null)}>
                    <Text style={[s.link, { color: C.danger }]}>{t("removePhoto")}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {mode === "register" && (
            <TextInput style={input} placeholder={t("name")} placeholderTextColor={C.muted} value={name} onChangeText={setName} />
          )}
          <TextInput
            style={input} placeholder={t("email")} placeholderTextColor={C.muted} value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" autoCorrect={false}
          />
            <TextInput
              style={input} placeholder={t("password")} placeholderTextColor={C.muted}
              value={password} onChangeText={setPassword} secureTextEntry
            />

          {!!error && <Text style={s.error}>{error}</Text>}

          <TouchableOpacity style={s.primary} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>{btn}</Text>}
          </TouchableOpacity>
        </View>

        {mode === "login" && (
          <TouchableOpacity style={s.switch} onPress={() => go("register")}><Text style={s.switchText}>{t("noAccount")}</Text></TouchableOpacity>
        )}
        {mode === "register" && (
          <TouchableOpacity style={s.switch} onPress={() => go("login")}><Text style={s.switchText}>{t("haveAccount")}</Text></TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: "center" },
  logo: { alignSelf: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" },
  logoEmoji: { fontSize: 36 },
  brand: { fontSize: 28, fontWeight: "800", textAlign: "center", color: C.text, marginTop: 10 },
  card: { backgroundColor: C.card, borderRadius: 20, padding: 20, ...shadow },
  title: { fontSize: 20, fontWeight: "700", color: C.text, marginBottom: 14 },
  photoRow: { alignItems: "center", marginBottom: 16, gap: 6 },
  photoHint: { color: C.muted, fontSize: 12 },
  input: { borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 12, color: C.text },
  link: { color: C.primary, fontWeight: "700", fontSize: 13 },
  error: { color: C.danger, textAlign: "center", marginVertical: 8, fontSize: 13 },
  primary: { backgroundColor: C.primary, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  switch: { paddingVertical: 18, alignItems: "center" },
  switchText: { color: C.primaryDark, fontSize: 14, fontWeight: "600" },
});
