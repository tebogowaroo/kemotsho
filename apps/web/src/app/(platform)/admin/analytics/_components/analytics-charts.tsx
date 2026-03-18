"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from "recharts"
import { formatCurrency } from "@kemotsho/core/lib/utils"

interface SalesChartProps {
    data: { date: string; value: number }[]
}

export function SalesChart({ data }: SalesChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <XAxis 
                    dataKey="date" 
                    tickFormatter={(str) => {
                        const date = new Date(str);
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }}
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R${value/100}`} // Assuming cents -> simple display
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip 
                    formatter={(value: number | undefined) => formatCurrency(value ?? 0)}
                    labelFormatter={(label) => new Date(label).toDateString()}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#2563eb" 
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}

interface TopProductsChartProps {
    data: { name: string; quantity: number; revenue: number }[]
}

export function TopProductsChart({ data }: TopProductsChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
             <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150} 
                    tick={{fontSize: 12}} 
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip 
                    formatter={(value: number | undefined, name: string | undefined) => [
                        name === 'revenue' ? formatCurrency(value ?? 0) : (value ?? 0), 
                        name === 'revenue' ? 'Revenue' : 'Units Sold'
                    ]}
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="quantity" fill="#adfa1d" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    )
}
