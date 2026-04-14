"use client";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

type ResultData = {
  testTitle: string;
  accuracy: number;
};

export default function AccuracyChart({ data }: { data: ResultData[] }) {
  const chartData = [...data].reverse();

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-xl" style={{background: 'rgba(255,255,255,0.03)'}}>
        <span className="text-3xl mb-2">📈</span>
        <p className="text-[var(--text-muted)] text-sm">No results available for graph.</p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 15, left: -20, bottom: 30 }}
        >
          <defs>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="testTitle"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            angle={-30}
            textAnchor="end"
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 11 }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(17, 24, 39, 0.95)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
              color: "#f1f5f9",
            }}
            formatter={(value: string | number | readonly (string | number)[] | undefined | null) => {
              let num = 0;
              if (typeof value === 'number') num = value;
              else if (typeof value === 'string') num = Number(value);
              else if (Array.isArray(value) && value.length > 0) num = Number(value[0]);
              return [`${num.toFixed(1)}%`, "Accuracy"];
            }}
          />
          <Area
            type="monotone"
            dataKey="accuracy"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#accuracyGradient)"
            dot={{ r: 5, fill: "#6366f1", strokeWidth: 2, stroke: "#0a0e1a" }}
            activeDot={{ r: 7, fill: "#8b5cf6", stroke: "#0a0e1a", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
