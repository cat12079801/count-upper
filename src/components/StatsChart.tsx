"use client";

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { ymLabel } from "@/lib/date";
import type { ChartDatum, ViewMode } from "@/lib/aggregate";

export function StatsChart({
  view,
  year,
  month,
  unit,
  data,
  total,
  activeUnits,
  best,
  goal,
  onChangeView,
  onShift,
}: {
  view: "daily" | "monthly";
  year: number;
  month: number;
  unit: string;
  data: ChartDatum[];
  total: number;
  activeUnits: number;
  best: number;
  goal?: number | null;
  onChangeView: (view: ViewMode) => void;
  onShift: (delta: number) => void;
}) {
  const average = activeUnits > 0 ? total / activeUnits : 0;
  const periodLabel =
    view === "daily" ? ymLabel(year, month) : `${year}年`;
  const activeLabel = view === "daily" ? "記録日数" : "記録月数";

  // 日次目標は日単位ビューで基準として使う（1日あたりの目標のため）
  const showGoal = view === "daily" && !!goal && goal > 0;
  // 目標を基準にするため、Y軸上限を目標と最高値の大きい方に合わせる
  const domainMax = showGoal
    ? Math.max(Math.ceil((goal as number) * 1.1), best)
    : undefined;

  // X軸に表示する目盛り
  const ticks =
    view === "daily"
      ? ["1", "7", "14", "21", "28", String(data.length)]
      : data.map((d) => d.label);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ViewTabs view={view} onChangeView={onChangeView} />
        <PeriodNav label={periodLabel} onShift={onShift} />
      </div>

      <div>
        <div className="flex items-end gap-2">
          <span className="text-6xl font-black italic tracking-tight tabular-nums">
            {total.toLocaleString()}
          </span>
          <span className="mb-2 text-sm font-semibold text-neutral-400">
            {unit}
          </span>
        </div>
        <div className="mt-3 flex gap-8">
          <Stat label={activeLabel} value={activeUnits.toLocaleString()} />
          <Stat
            label="平均"
            value={average ? average.toFixed(1) : "0"}
            suffix={unit}
          />
          <Stat label="最高" value={best.toLocaleString()} suffix={unit} />
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            barCategoryGap={view === "daily" ? "18%" : "28%"}
          >
            <XAxis
              dataKey="label"
              ticks={ticks}
              interval={0}
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              orientation="right"
              width={34}
              domain={domainMax ? [0, domainMax] : undefined}
              tick={{ fontSize: 11, fill: "#a3a3a3" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            {average > 0 && (
              <ReferenceLine
                y={average}
                stroke="#cbd5e1"
                strokeDasharray="4 4"
                label={{
                  value: average.toFixed(1),
                  position: "right",
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
            )}
            {showGoal && (
              <ReferenceLine
                y={goal as number}
                stroke="var(--accent)"
                strokeWidth={1.5}
                label={{
                  value: `目標 ${goal}`,
                  position: "insideTopLeft",
                  fontSize: 11,
                  fill: "var(--accent)",
                }}
              />
            )}
            <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.value <= 0
                      ? "transparent"
                      : showGoal && d.value < (goal as number)
                        ? "#bae6fd"
                        : "var(--accent)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-bold tabular-nums">
        {value}
        {suffix && (
          <span className="ml-0.5 text-xs font-medium text-neutral-400">
            {suffix}
          </span>
        )}
      </span>
      <span className="text-xs text-neutral-400">{label}</span>
    </div>
  );
}

function ViewTabs({
  view,
  onChangeView,
}: {
  view: "daily" | "monthly";
  onChangeView: (view: ViewMode) => void;
}) {
  const tabs: { key: ViewMode; label: string }[] = [
    { key: "daily", label: "月" },
    { key: "monthly", label: "年" },
  ];
  return (
    <div className="inline-flex rounded-full bg-neutral-200/70 p-0.5">
      {tabs.map((t) => {
        const active = t.key === view;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChangeView(t.key)}
            className={`rounded-full px-5 py-1 text-sm font-semibold transition ${
              active ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function PeriodNav({
  label,
  onShift,
}: {
  label: string;
  onShift: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onShift(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200"
        aria-label="前へ"
      >
        ‹
      </button>
      <span className="min-w-24 text-center font-semibold">{label}</span>
      <button
        type="button"
        onClick={() => onShift(1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200"
        aria-label="次へ"
      >
        ›
      </button>
    </div>
  );
}
