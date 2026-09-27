"use client";
// Preview written by Fabrials for Kibo UI's contribution graph. Synthetic, seeded activity.
import { eachDayOfInterval, formatISO, subDays } from "date-fns";
import {
  ContributionGraph,
  ContributionGraphBlock,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
} from "@/components/external/kibo/contribution-graph";

const end = new Date(2026, 8, 27);
let seed = 7;
const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const data = eachDayOfInterval({ start: subDays(end, 181), end }).map((day) => {
  const count = random() < 0.35 ? 0 : Math.floor(random() * 12);
  return { date: formatISO(day, { representation: "date" }), count, level: Math.min(4, Math.ceil(count / 3)) };
});

export default function KiboContributionGraphDemo() {
  return (
    <ContributionGraph data={data} className="max-w-full">
      <ContributionGraphCalendar>
        {({ activity, dayIndex, weekIndex }) => (
          <ContributionGraphBlock activity={activity} dayIndex={dayIndex} weekIndex={weekIndex} />
        )}
      </ContributionGraphCalendar>
      <ContributionGraphFooter>
        <ContributionGraphTotalCount />
        <ContributionGraphLegend />
      </ContributionGraphFooter>
    </ContributionGraph>
  );
}
