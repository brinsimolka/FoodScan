import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { getMeals, updatePhoto } from "../services/nutritionApi";
import { useI18n } from "../i18n";
import LangSwitcher from "../components/LangSwitcher";
import Avatar from "../components/Avatar";
import { pickPhoto } from "../components/pickPhoto";
import { C, shadow } from "../theme";
import type { Totals, User } from "../types/nutrition";

const EMPTY: Totals = { calories: 0, carbsG: 0, proteinG: 0, fatG: 0 };
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

export default function HomeScreen({
  user, onUser, onScan, onHistory, onLogout,
}: { user: User; onUser: (u: User) => void; onScan: () => void; onHistory: () => void; onLogout: () => void }) {
  const { t, row, ta } = useI18n();
  const [totals, setTotals] = useState<Totals>(EMPTY);
  const [count, setCount] = useState(0);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const today = (await getMeals()).filter((m) => isToday(m.loggedAt));
      setTotals(today.reduce(
        (a, m) => ({ calories: a.calories + m.calories, carbsG: a.carbsG + m.carbsG, proteinG: a.proteinG + m.proteinG, fatG: a.fatG + m.fatG }),
        EMPTY
      ));
      setCount(today.length);
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const changePhoto = async () => {
    const p = await pickPhoto();
    if (!p) return;
    try { onUser(await updatePhoto(p)); } catch { /* ignoré : la photo reste inchangée */ }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={s.container}>
      <View style={[s.header, { flexDirection: row }]}>
        <TouchableOpacity onPress={changePhoto}><Avatar photo={user.photo} name={user.name} size={64} /></TouchableOpacity>
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={[s.hello, { textAlign: ta }]}>{t("hello")} {user.name} 👋</Text>
          <Text style={[s.sub, { textAlign: ta }]}>{count} {t("itemsToday")}</Text>
        </View>
      </View>

      {error && <Text style={s.error}>{t("serverDown")}</Text>}

      <View style={s.hero}>
        <Text style={s.heroValue}>{Math.round(totals.calories)}</Text>
        <Text style={s.heroLabel}>{t("kcal")} · {t("today")}</Text>
      </View>

      <View style={[s.macros, { flexDirection: row }]}>
        <Macro label={t("carbs")} value={totals.carbsG} color="#F59E0B" />
        <Macro label={t("protein")} value={totals.proteinG} color="#3B82F6" />
        <Macro label={t("fat")} value={totals.fatG} color="#EF4444" />
      </View>

      <TouchableOpacity style={s.primary} onPress={onScan}>
        <Text style={s.primaryText}>📷  {t("scanFood")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.secondary} onPress={onHistory}>
        <Text style={s.secondaryText}>📖  {t("history")}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.link} onPress={refresh}>
        <Text style={s.linkText}>🔄 {t("refresh")}</Text>
      </TouchableOpacity>

      <Text style={s.langLabel}>{t("language")}</Text>
      <LangSwitcher />

      <TouchableOpacity
        style={s.link}
        onPress={() => Alert.alert(t("logout"), t("logoutAsk"), [
          { text: t("cancel"), style: "cancel" },
          { text: t("logout"), style: "destructive", onPress: onLogout },
        ])}
      >
        <Text style={[s.linkText, { color: C.danger }]}>{t("logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={s.macro}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.macroValue}>{Math.round(value)} g</Text>
      <Text style={s.macroLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 20 },
  hello: { fontSize: 20, fontWeight: "800", color: C.text },
  sub: { fontSize: 13, color: C.muted, marginTop: 2 },
  error: { color: C.danger, textAlign: "center", marginBottom: 12, fontSize: 13 },
  hero: { backgroundColor: C.primary, borderRadius: 24, paddingVertical: 28, alignItems: "center", ...shadow },
  heroValue: { fontSize: 56, fontWeight: "800", color: "#fff" },
  heroLabel: { fontSize: 14, color: "#D6F1E2", marginTop: 2, fontWeight: "600" },
  macros: { marginVertical: 16, gap: 10 },
  macro: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, alignItems: "center", ...shadow },
  dot: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  macroValue: { fontSize: 18, fontWeight: "800", color: C.text },
  macroLabel: { fontSize: 12, color: C.muted, marginTop: 2 },
  primary: { backgroundColor: C.text, paddingVertical: 18, borderRadius: 16, alignItems: "center", marginTop: 4 },
  primaryText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondary: { backgroundColor: C.card, paddingVertical: 16, borderRadius: 16, alignItems: "center", marginTop: 12, borderWidth: 1, borderColor: C.border },
  secondaryText: { color: C.text, fontSize: 16, fontWeight: "700" },
  link: { paddingVertical: 14, alignItems: "center" },
  linkText: { color: C.primaryDark, fontSize: 14, fontWeight: "600" },
  langLabel: { textAlign: "center", color: C.muted, fontSize: 12, marginTop: 10, marginBottom: 8 },
});
