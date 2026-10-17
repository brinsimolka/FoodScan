import React from "react";
import { Image, Text, View } from "react-native";
import { C } from "../theme";

export default function Avatar({ photo, name, size = 72 }: { photo?: string | null; name?: string; size?: number }) {
  const base = { width: size, height: size, borderRadius: size / 2 };
  if (photo) return <Image source={{ uri: photo }} style={base} />;
  return (
    <View style={[base, { backgroundColor: C.primarySoft, alignItems: "center", justifyContent: "center" }]}>
      <Text style={{ fontSize: size * 0.42, fontWeight: "700", color: C.primary }}>
        {(name?.trim()[0] ?? "?").toUpperCase()}
      </Text>
    </View>
  );
}
