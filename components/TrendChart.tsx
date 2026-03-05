'use client';

import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TrendChartData {
  label: string;
  count: number;
}

interface TrendChartProps {
  data: TrendChartData[];
  title: string;
  chartType: 'line' | 'bar';
}

export default function TrendChart({ data, title, chartType }: TrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={320}>
        {chartType === 'line' ? (
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelStyle={{ color: '#78350f', fontWeight: 600 }}
              itemStyle={{ color: '#92400e' }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
              activeDot={{ fill: '#d97706', strokeWidth: 0, r: 6 }}
            />
          </LineChart>
        ) : (
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                fontSize: '13px',
              }}
              labelStyle={{ color: '#78350f', fontWeight: 600 }}
              itemStyle={{ color: '#92400e' }}
            />
            <Bar
              dataKey="count"
              fill="#fbbf24"
              radius={[4, 4, 0, 0]}
              activeBar={{ fill: '#f59e0b' }}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
