import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { logMeal } from "../services/nutritionApi";
import { useI18n } from "../i18n";
import { C, shadow } from "../theme";
import type { ScanResult } from "../types/nutrition";

const PORTIONS = [0.25, 0.5, 0.75, 1, 1.5, 2];

export default function ResultScreen({ result, onDone }: { result: ScanResult; onDone: () => void }) {
  const { t, row, ta } = useI18n();
  const { source, preview } = result;
  const [portion, setPortion] = useState(1);
  const [saving, setSaving] = useState(false);

  const scaled = (v: number) => Math.round(v * portion);

  const confirm = async () => {
    setSaving(true);
    try {
      await logMeal({ source, preview, portionMultiplier: portion });
      onDone();
    } catch {
      Alert.alert(t("error"), t("errSave"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 40 }}>
      <View style={s.card}>
        <Text style={[s.name, { textAlign: ta }]}>{preview.foodName}</Text>
        {!!preview.brand && <Text style={[s.brand, { textAlign: ta }]}>{preview.brand}</Text>}

        {source === "photo" && preview.aiConfidence !== undefined && (
          <View style={s.badge}><Text style={s.badgeText}>{t("aiConf")} : {Math.round(preview.aiConfidence * 100)}%</Text></View>
        )}
        {!!preview.notes && <Text style={[s.notes, { textAlign: ta }]}>{preview.notes}</Text>}
        {preview.aiRawItems?.map((i, k) => (
          <Text key={k} style={[s.item, { textAlign: ta }]}>• {i.label} (~{i.estimatedGrams} g)</Text>
        ))}
      </View>

      <Text style={[s.label, { textAlign: ta }]}>{t("portion")}</Text>
      <View style={[s.chips, { flexDirection: row }]}>
        {PORTIONS.map((p) => (
          <TouchableOpacity key={p} style={[s.chip, portion === p && s.chipOn]} onPress={() => setPortion(p)}>
            <Text style={[s.chipText, portion === p && s.chipTextOn]}>{p}×</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.grid, { flexDirection: row }]}>
        <Box label={t("calories")} value={scaled(preview.calories)} unit={t("kcal")} main />
        <Box label={t("glucides")} value={scaled(preview.carbsG)} unit="g" />
        <Box label={t("proteines")} value={scaled(preview.proteinG)} unit="g" />
        <Box label={t("lipides")} value={scaled(preview.fatG)} unit="g" />
      </View>

      <Text style={s.question}>{t("ateQ")}</Text>
      <TouchableOpacity style={s.confirm} onPress={confirm} disabled={saving}>
        <Text style={s.confirmText}>{saving ? t("saving") : `✅  ${t("yes")}`}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancel} onPress={onDone} disabled={saving}>
        <Text style={s.cancelText}>❌  {t("no")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Box({ label, value, unit, main }: { label: string; value: number; unit: string; main?: boolean }) {
  return (
    <View style={[s.box, main && s.boxMain]}>
      <Text style={[s.boxValue, main && { color: "#fff" }]}>{value}</Text>
      <Text style={[s.boxUnit, main && { color: "#D6F1E2" }]}>{unit}</Text>
      <Text style={[s.boxLabel, main && { color: "#fff" }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 20, padding: 18, ...shadow },
  name: { fontSize: 22, fontWeight: "800", color: C.text },
  brand: { fontSize: 14, color: C.muted, marginTop: 2 },
  badge: { alignSelf: "flex-start", backgroundColor: C.warnSoft, borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10, marginTop: 8 },
  badgeText: { color: C.warn, fontSize: 12, fontWeight: "600" },
  notes: { fontSize: 13, color: C.muted, marginTop: 10, fontStyle: "italic" },
  item: { fontSize: 14, color: C.text, marginTop: 4 },
  label: { fontSize: 14, fontWeight: "700", color: C.text, marginTop: 22, marginBottom: 8 },
  chips: { flexWrap: "wrap" },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, marginEnd: 8, marginBottom: 8 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { color: C.text, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  grid: { flexWrap: "wrap", justifyContent: "space-between", marginTop: 12 },
  box: { width: "48.5%", backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 10, alignItems: "center", ...shadow },
  boxMain: { backgroundColor: C.primary },
  boxValue: { fontSize: 26, fontWeight: "800", color: C.text },
  boxUnit: { fontSize: 12, color: C.muted },
  boxLabel: { fontSize: 13, color: C.text, marginTop: 4 },
  question: { fontSize: 19, fontWeight: "800", color: C.text, textAlign: "center", marginTop: 26 },
  confirm: { backgroundColor: C.primary, marginTop: 14, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  cancel: { backgroundColor: C.card, marginTop: 10, paddingVertical: 15, borderRadius: 14, alignItems: "center", borderWidth: 1, borderColor: C.border },
  cancelText: { color: C.text, fontSize: 15, fontWeight: "600" },
});
