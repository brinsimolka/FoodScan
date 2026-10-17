import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LANGS, useI18n } from "../i18n";
import { C } from "../theme";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <View style={s.wrap}>
      {LANGS.map((l) => (
        <TouchableOpacity key={l.key} style={[s.btn, lang === l.key && s.on]} onPress={() => setLang(l.key)}>
          <Text style={[s.text, lang === l.key && s.textOn]}>{l.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", backgroundColor: C.card, borderRadius: 20, padding: 3, borderWidth: 1, borderColor: C.border, alignSelf: "center" },
  btn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16 },
  on: { backgroundColor: C.primary },
  text: { color: C.muted, fontWeight: "700", fontSize: 13 },
  textOn: { color: "#fff" },
});
