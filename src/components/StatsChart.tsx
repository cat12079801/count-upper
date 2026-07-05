"use client";

import Link from "next/link";
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
import type { ChartDatum } from "@/lib/aggregate";

export function StatsChart({
  view,
  year,
  month,
  unit,
  data,
  total,
  activeUnits,
  best,
  selectedId,
}: {
  view: "daily" | "monthly";
  year: number;
  month: number;
  unit: string;
  data: ChartDatum[];
  total: number;
  activeUnits: number;
  best: number;
  selectedId: string;
}) {
  const average = activeUnits > 0 ? total / activeUnits : 0;
  const periodLabel =
    view === "daily" ? ymLabel(year, month) : `${year}年`;
  const activeLabel = view === "daily" ? "記録日数" : "記録月数";

  // X軸に表示する目盛り
  const ticks =
    view === "daily"
      ? ["1", "7", "14", "21", "28", String(data.length)]
      : data.map((d) => d.label);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ViewTabs view={view} year={year} month={month} selectedId={selectedId} />
        <PeriodNav
          view={view}
          year={year}
          month={month}
          selectedId={selectedId}
          label={periodLabel}
        />
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
            <Bar dataKey="value" radius={[3, 3, 0, 0]} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell
                  key={i}
                  fill={d.value > 0 ? "var(--accent)" : "transparent"}
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
  year,
  month,
  selectedId,
}: {
  view: "daily" | "monthly";
  year: number;
  month: number;
  selectedId: string;
}) {
  const tabs: { key: "daily" | "monthly"; label: string }[] = [
    { key: "daily", label: "月" },
    { key: "monthly", label: "年" },
  ];
  return (
    <div className="inline-flex rounded-full bg-neutral-200/70 p-0.5">
      {tabs.map((t) => {
        const q = new URLSearchParams({
          c: selectedId,
          view: t.key,
          y: String(year),
          m: String(month),
        });
        const active = t.key === view;
        return (
          <Link
            key={t.key}
            href={`/app?${q.toString()}`}
            className={`rounded-full px-5 py-1 text-sm font-semibold transition ${
              active ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

function PeriodNav({
  view,
  year,
  month,
  selectedId,
  label,
}: {
  view: "daily" | "monthly";
  year: number;
  month: number;
  selectedId: string;
  label: string;
}) {
  function shift(delta: number) {
    let y = year;
    let m = month;
    if (view === "daily") {
      m += delta;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
    } else {
      y += delta;
    }
    const q = new URLSearchParams({
      c: selectedId,
      view,
      y: String(y),
      m: String(m),
    });
    return `/app?${q.toString()}`;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href={shift(-1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200"
        aria-label="前へ"
      >
        ‹
      </Link>
      <span className="min-w-24 text-center font-semibold">{label}</span>
      <Link
        href={shift(1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200"
        aria-label="次へ"
      >
        ›
      </Link>
    </div>
  );
}
