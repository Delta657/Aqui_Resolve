"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const data = [
  { name: "12/07/2025", value: 4 },
  { name: "13/07/2025", value: 11 },
  { name: "14/07/2025", value: 15 },
  { name: "15/07/2025", value: 18 },
  { name: "16/07/2025", value: 9 },
  { name: "17/07/2025", value: 15 },
  { name: "18/07/2025", value: 15 },
  { name: "19/07/2025", value: 7 },
  { name: "20/07/2025", value: 10 },
  { name: "21/07/2025", value: 12 },
  { name: "22/07/2025", value: 18 },
  { name: "23/07/2025", value: 6 },
  { name: "24/07/2025", value: 9 },
  { name: "25/07/2025", value: 12 },
  { name: "26/07/2025", value: 10 },
  { name: "27/07/2025", value: 7 },
  { name: "28/07/2025", value: 2 },
  { name: "29/07/2025", value: 12 },
  { name: "30/07/2025", value: 8 },
  { name: "31/07/2025", value: 7 },
  { name: "01/08/2025", value: 3 },
]

export function ServiceChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" fontSize={12} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis fontSize={12} />
          <Bar dataKey="value" fill="#3b82f6" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
