import { getDateInfo } from "@/utils/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { DateTime } from "luxon";

type HeatmapRow = {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  created_at: string;
  frequency: string;
  target: number;
  active: number;
  order: number;
  week_start: string | null;
  statuses: string | null; // stored as JSON string
};

const HEATMAP_QUERY = `
SELECT 
  h.*,
  hh.week_start,
  hh.statuses
FROM habits h
LEFT JOIN habit_heatmap hh
  ON hh.habit_id = h.id
  AND hh.week_start BETWEEN ? AND ?
WHERE h.active = 1
ORDER BY h."order" ASC, hh.week_start ASC;
`;

export function useHeatmapOverall() {
  const db = useSQLiteContext();

  const {
    data: overallData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["heatmap-overall"],
    queryFn: async () => {
      const t = getDateInfo();

      const currentWeekStart = DateTime.fromISO(t.weekStart);

      // Rolling 52-week window (including current week)
      const rangeStartWeek = currentWeekStart
        .minus({ weeks: 51 })
        .startOf("week")
        .toFormat("yyyy-MM-dd");

      const rangeEndWeek = currentWeekStart.toFormat("yyyy-MM-dd");

      // Build exactly 52 weeks
      const weeks: string[] = [];
      let cursor = DateTime.fromISO(rangeStartWeek);

      for (let i = 0; i < 52; i++) {
        weeks.push(cursor.toFormat("yyyy-MM-dd"));
        cursor = cursor.plus({ weeks: 1 });
      }

      // Fetch only the rolling range
      const rows = await db.getAllAsync<HeatmapRow>(HEATMAP_QUERY, [
        rangeStartWeek,
        rangeEndWeek,
      ]);

      // Group by habit ID
      const habitMap = new Map<number, any>();
      for (const row of rows) {
        if (!habitMap.has(row.id)) {
          habitMap.set(row.id, {
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            color: row.color,
            created_at: row.created_at,
            frequency: row.frequency,
            target: row.target,
            active: row.active,
            order: row.order,
            entriesMap: {}, // week_start → statuses[]
          });
        }

        const habit = habitMap.get(row.id);

        if (row.week_start && row.statuses) {
          habit.entriesMap[row.week_start] = JSON.parse(row.statuses) as (
            | 0
            | 1
            | null
          )[];
        }
      }

      // Build final result
      const result = Array.from(habitMap.values()).map((habit) => {
        const entries: (0 | 1 | null)[][] = weeks.map((weekStart) => {
          return habit.entriesMap[weekStart] ?? Array(7).fill(null);
        });

        return {
          ...habit,
          entries,
          weeks, // same 52-week window for all habits
        };
      });

      return result;
    },
  });

  return { overallData, isLoading, error, refetch };
}
