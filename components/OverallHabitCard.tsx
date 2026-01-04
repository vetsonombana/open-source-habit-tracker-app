// OverallHabitItem.tsx
import Colors from "@/utils/colors";
import { Ionicons } from "@expo/vector-icons";
import { Canvas, Rect as SkRect } from "@shopify/react-native-skia";
import { DateTime } from "luxon";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAYS = 7;
const CELL_STRIDE = CELL_SIZE + CELL_GAP;

const getColor = (status: 0 | 1 | null, baseColor: string | null) =>
  status === 1 ? (baseColor ?? "#40c463") : Colors.cellColor;

export default function OverallHabitCard({
  habit,
  todayIso,
  todayWeekStart,
  toggleCheckGlobal,
  onLongPressHabit,
}: {
  habit: any;
  todayIso: string;
  todayWeekStart: string;
  toggleCheckGlobal: (
    habitId: number,
    dateIso: string,
    curStatus: 0 | 1 | null
  ) => void;
  onLongPressHabit: (habit: any) => void;
}) {
  const lastWeekIndex = Math.max(0, habit.entries.length - 1);
  const todayWeek = habit.entries[lastWeekIndex] ?? [];
  const weekdayIdx = DateTime.fromISO(todayIso).weekday - 1;
  const todayStatus = todayWeek?.[weekdayIdx] ?? null;

  const rects = useMemo(() => {
    const arr: { x: number; y: number; status: 0 | 1 | null }[] = [];

    for (let w = 0; w < habit.entries.length; w++) {
      const week = habit.entries[w] ?? Array(DAYS).fill(null);
      for (let d = 0; d < DAYS; d++) {
        arr.push({
          x: w * CELL_STRIDE,
          y: d * CELL_STRIDE,
          status: week[d] ?? null,
        });
      }
    }
    return arr;
  }, [habit.entries]);

  const width = Math.max(1, habit.entries.length) * CELL_STRIDE - CELL_GAP;
  const height = DAYS * CELL_STRIDE - CELL_GAP;

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [habit.entries.length]);

  const onPressToday = useCallback(() => {
    const todayDateIso = DateTime.fromISO(todayWeekStart)
      .plus({ days: weekdayIdx })
      .toFormat("yyyy-MM-dd");

    toggleCheckGlobal(habit.id, todayDateIso, todayStatus);
  }, [todayWeekStart, weekdayIdx, toggleCheckGlobal, habit.id, todayStatus]);

  return (
    <View style={styles.card}>
      <TouchableOpacity
        onLongPress={() => onLongPressHabit(habit)}
        activeOpacity={0.7}
        style={styles.headerRow}
      >
        <View style={styles.iconWrap}>
          <Ionicons
            name={habit.icon ?? "help-outline"}
            size={18}
            color="#fff"
          />
        </View>

        <Text numberOfLines={1} style={styles.habitName}>
          {habit.name}
        </Text>

        <Pressable
          onPress={onPressToday}
          style={[
            styles.todayButton,
            {
              backgroundColor:
                todayStatus === 1
                  ? (habit.color ?? "#40c463")
                  : Colors.checkBoxBackground,
            },
          ]}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </Pressable>
      </TouchableOpacity>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        ref={scrollRef}
        contentContainerStyle={{ flexDirection: "row" }}
        style={{ marginTop: 6 }}
      >
        <Canvas style={{ width, height }}>
          {rects.map((r, i) => (
            <SkRect
              key={i}
              x={r.x}
              y={r.y}
              width={CELL_SIZE}
              height={CELL_SIZE}
              color={getColor(r.status, habit.color)}
            />
          ))}
        </Canvas>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.habitCardBackground,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  iconWrap: {
    backgroundColor: Colors.habitIconBackground,
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
  },
  habitName: { color: "white", flex: 1, fontSize: 16 },
  todayButton: {
    // width: 30,
    // height: 30,
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
