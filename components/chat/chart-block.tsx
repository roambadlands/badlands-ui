"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  ChartBlock,
  ChartSeriesItem,
  PieSeriesItem,
  ScatterSeriesItem,
  ScatterPoint,
} from "@/lib/types";

interface ChartBlockRendererProps {
  block: ChartBlock;
}

// Color palette for chart series
const CHART_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
];

function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Renders a chart block using Recharts.
 * Supports bar, line, pie, area, and scatter charts.
 */
export function ChartBlockRenderer({ block }: ChartBlockRendererProps) {
  const { chart_type, chart_title, chart_data } = block;
  const title = chart_title || chart_data.title;

  return (
    <div className="my-4 rounded-lg border border-border bg-card p-4">
      {title && (
        <h3 className="text-center text-sm font-semibold mb-4">{title}</h3>
      )}
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart(chart_type, chart_data)}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function renderChart(
  chartType: string,
  data: ChartBlock["chart_data"]
): React.ReactElement {
  switch (chartType) {
    case "bar":
      return renderBarChart(data);
    case "line":
      return renderLineChart(data);
    case "pie":
      return renderPieChart(data);
    case "area":
      return renderAreaChart(data);
    case "scatter":
      return renderScatterChart(data);
    default:
      return renderBarChart(data);
  }
}

/**
 * Transform series data into Recharts format.
 * Recharts expects: [{ category: "Q1", series1: 100, series2: 80 }, ...]
 */
function transformSeriesData(data: ChartBlock["chart_data"]): Record<string, unknown>[] {
  const categories = data.x_axis?.data || [];
  const series = data.series as ChartSeriesItem[] | undefined;

  if (!series || series.length === 0) {
    return [];
  }

  return categories.map((category, index) => {
    const point: Record<string, unknown> = { category };
    series.forEach((s) => {
      point[s.name] = s.data[index] ?? 0;
    });
    return point;
  });
}

function renderBarChart(data: ChartBlock["chart_data"]): React.ReactElement {
  const chartData = transformSeriesData(data);
  const series = data.series as ChartSeriesItem[] | undefined;

  return (
    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis
        dataKey="category"
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.x_axis?.label
            ? { value: data.x_axis.label, position: "insideBottom", offset: -5 }
            : undefined
        }
      />
      <YAxis
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.y_axis?.label
            ? { value: data.y_axis.label, angle: -90, position: "insideLeft" }
            : undefined
        }
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
        }}
      />
      <Legend />
      {series?.map((s, index) => (
        <Bar key={s.name} dataKey={s.name} fill={getColor(index)} />
      ))}
    </BarChart>
  );
}

function renderLineChart(data: ChartBlock["chart_data"]): React.ReactElement {
  const chartData = transformSeriesData(data);
  const series = data.series as ChartSeriesItem[] | undefined;

  return (
    <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis
        dataKey="category"
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.x_axis?.label
            ? { value: data.x_axis.label, position: "insideBottom", offset: -5 }
            : undefined
        }
      />
      <YAxis
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.y_axis?.label
            ? { value: data.y_axis.label, angle: -90, position: "insideLeft" }
            : undefined
        }
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
        }}
      />
      <Legend />
      {series?.map((s, index) => (
        <Line
          key={s.name}
          type="monotone"
          dataKey={s.name}
          stroke={getColor(index)}
          strokeWidth={2}
          dot={{ fill: getColor(index) }}
        />
      ))}
    </LineChart>
  );
}

function renderPieChart(data: ChartBlock["chart_data"]): React.ReactElement {
  const series = data.series as PieSeriesItem[] | undefined;

  if (!series || series.length === 0) {
    return <BarChart data={[]}><Bar dataKey="value" /></BarChart>;
  }

  // Transform to array of objects with explicit typing for Recharts
  const pieData = series.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  return (
    <PieChart>
      <Pie
        data={pieData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
        labelLine={{ strokeWidth: 1 }}
      >
        {pieData.map((_, index) => (
          <Cell key={`cell-${index}`} fill={getColor(index)} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
        }}
      />
      <Legend />
    </PieChart>
  );
}

function renderAreaChart(data: ChartBlock["chart_data"]): React.ReactElement {
  const chartData = transformSeriesData(data);
  const series = data.series as ChartSeriesItem[] | undefined;

  return (
    <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis
        dataKey="category"
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.x_axis?.label
            ? { value: data.x_axis.label, position: "insideBottom", offset: -5 }
            : undefined
        }
      />
      <YAxis
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.y_axis?.label
            ? { value: data.y_axis.label, angle: -90, position: "insideLeft" }
            : undefined
        }
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
        }}
      />
      <Legend />
      {series?.map((s, index) => (
        <Area
          key={s.name}
          type="monotone"
          dataKey={s.name}
          stroke={getColor(index)}
          fill={getColor(index)}
          fillOpacity={0.3}
        />
      ))}
    </AreaChart>
  );
}

function renderScatterChart(data: ChartBlock["chart_data"]): React.ReactElement {
  const series = data.series as ScatterSeriesItem[] | undefined;

  if (!series || series.length === 0) {
    return <BarChart data={[]}><Bar dataKey="value" /></BarChart>;
  }

  // Transform scatter data: [[x, y], ...] -> [{ x, y }, ...]
  const transformedSeries = series.map((s) => ({
    name: s.name,
    data: s.data.map((point: ScatterPoint | number[]) => {
      if (Array.isArray(point)) {
        return { x: point[0], y: point[1] };
      }
      return point;
    }),
  }));

  return (
    <ScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
      <XAxis
        type="number"
        dataKey="x"
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.x_axis?.label
            ? { value: data.x_axis.label, position: "insideBottom", offset: -5 }
            : undefined
        }
      />
      <YAxis
        type="number"
        dataKey="y"
        tick={{ fontSize: 12 }}
        className="text-muted-foreground"
        label={
          data.y_axis?.label
            ? { value: data.y_axis.label, angle: -90, position: "insideLeft" }
            : undefined
        }
      />
      <Tooltip
        contentStyle={{
          backgroundColor: "hsl(var(--popover))",
          border: "1px solid hsl(var(--border))",
          borderRadius: "6px",
        }}
        cursor={{ strokeDasharray: "3 3" }}
      />
      <Legend />
      {transformedSeries.map((s, index) => (
        <Scatter key={s.name} name={s.name} data={s.data} fill={getColor(index)} />
      ))}
    </ScatterChart>
  );
}
