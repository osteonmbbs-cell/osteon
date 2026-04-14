"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ResultData = {
  testTitle: string;
  accuracy: number;
};

export default function AccuracyChart({ data }: { data: ResultData[] }) {
  // Map and reverse the array to show chronological order
  const chartData = [...data].reverse();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-lg">
        No results available for graph.
      </div>
    );
  }

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 10,
            right: 15,
            left: -20,
            bottom: 30,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="testTitle" 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            angle={-30}
            textAnchor="end"
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip 
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)" }}
            formatter={(value: string | number | readonly (string | number)[] | undefined | null) => {
              let num = 0;
              if (typeof value === 'number') num = value;
              else if (typeof value === 'string') num = Number(value);
              else if (Array.isArray(value) && value.length > 0) num = Number(value[0]);
              return [`${num.toFixed(1)}%`, "Accuracy"];
            }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#0B1E40" 
            strokeWidth={3}
            dot={{ r: 4, fill: "#0B1E40", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
