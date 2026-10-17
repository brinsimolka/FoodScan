import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { deleteMeal, getMeals } from "../services/nutritionApi";
import { useI18n } from "../i18n";
import { C, shadow } from "../theme";
import type { LoggedMeal } from "../types/nutrition";

const dayKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const timeOf = (iso: string, locale: string) => new Date(iso).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

export default function HistoryScreen({ onBack }: { onBack: () => void }) {
  const { t, row, ta, locale } = useI18n();
  const [meals, setMeals] = useState<LoggedMeal[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      setMeals(await getMeals());
      setError(false);
    } catch {
      setError(true);
      setMeals((m) => m ?? []);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dayLabel = useCallback((key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const today = dayKey(new Date().toISOString());
    const yest = dayKey(new Date(Date.now() - 86400000).toISOString());
    const prefix = key === today ? `${t("today")} · ` : key === yest ? `${t("yesterday")} · ` : "";
    return prefix + label;
  }, [locale, t]);

  const sections = useMemo(() => {
    const byDay = new Map<string, LoggedMeal[]>();
    (meals ?? []).forEach((m) => {
      const k = dayKey(m.loggedAt);
      byDay.set(k, [...(byDay.get(k) ?? []), m]);
    });
    return [...byDay.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, data]) => ({
        key,
        title: dayLabel(key),
        total: Math.round(data.reduce((sum, m) => sum + m.calories, 0)),
        data,
      }));
  }, [meals, dayLabel]);

  const remove = (m: LoggedMeal) =>
    Alert.alert(m.foodName, t("deleteAsk"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"), style: "destructive",
        onPress: async () => {
          try {
            await deleteMeal(m.id);
            setMeals((list) => (list ?? []).filter((x) => x.id !== m.id));
          } catch {
            Alert.alert(t("error"), t("errDelete"));
          }
        },
      },
    ]);

  return (
    <View style={s.container}>
      <View style={[s.header, { flexDirection: row }]}>
        <TouchableOpacity onPress={onBack}><Text style={s.back}>{ta === "right" ? "›" : "‹"} {t("back")}</Text></TouchableOpacity>
        <Text style={s.title}>{t("history")}</Text>
        <View style={{ width: 60 }} />
      </View>

      {meals === null ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshing={false}
          onRefresh={load}
          ListEmptyComponent={
            <Text style={s.empty}>{error ? t("serverDown") : t("historyEmpty")}</Text>
          }
          renderSectionHeader={({ section }) => (
            <View style={[s.sectionHeader, { flexDirection: row }]}>
              <Text style={[s.sectionTitle, { textAlign: ta }]}>{section.title}</Text>
              <Text style={s.sectionTotal}>{section.total} {t("kcal")}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[s.row, { flexDirection: row }]}>
              <View style={{ flex: 1 }}>
                <Text style={[s.food, { textAlign: ta }]}>{item.foodName}</Text>
                <Text style={[s.meta, { textAlign: ta }]}>{timeOf(item.loggedAt, locale)} · {item.source === "photo" ? t("photo") : t("barcode")}</Text>
              </View>
              <Text style={s.kcal}>{Math.round(item.calories)} {t("kcal")}</Text>
              <TouchableOpacity onPress={() => remove(item)} hitSlop={10}>
                <Text style={s.del}>🗑</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: 20, paddingBottom: 12 },
  back: { color: C.primaryDark, fontSize: 16, fontWeight: "700", width: 80 },
  title: { fontSize: 20, fontWeight: "800", color: C.text },
  empty: { textAlign: "center", color: C.muted, marginTop: 40 },
  sectionHeader: { justifyContent: "space-between", backgroundColor: C.primarySoft, paddingVertical: 10, paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.primaryDark, textTransform: "capitalize", flex: 1 },
  sectionTotal: { fontSize: 14, fontWeight: "800", color: C.primaryDark },
  row: { alignItems: "center", paddingVertical: 12, paddingHorizontal: 20, backgroundColor: C.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  food: { fontSize: 15, fontWeight: "600", color: C.text },
  meta: { fontSize: 12, color: C.muted, marginTop: 2 },
  kcal: { fontSize: 14, color: C.text, fontWeight: "700", marginHorizontal: 12 },
  del: { fontSize: 18 },
});
