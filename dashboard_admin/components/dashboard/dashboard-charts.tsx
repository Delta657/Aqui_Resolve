"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

const serviceData = [
  { name: "01/08", serviços: 12, concluídos: 10 },
  { name: "02/08", serviços: 15, concluídos: 13 },
  { name: "03/08", serviços: 18, concluídos: 16 },
  { name: "04/08", serviços: 14, concluídos: 12 },
  { name: "05/08", serviços: 20, concluídos: 18 },
  { name: "06/08", serviços: 16, concluídos: 14 },
  { name: "07/08", serviços: 22, concluídos: 20 },
  { name: "08/08", serviços: 19, concluídos: 17 },
  { name: "09/08", serviços: 25, concluídos: 23 },
  { name: "10/08", serviços: 21, concluídos: 19 },
  { name: "11/08", serviços: 17, concluídos: 15 },
  { name: "12/08", serviços: 23, concluídos: 21 },
]

const statusData = [
  { name: "Concluídos", value: 65, color: "#16a34a" },
  { name: "Em Andamento", value: 20, color: "#f59e0b" },
  { name: "Aguardando", value: 10, color: "#3b82f6" },
  { name: "Cancelados", value: 5, color: "#ef4444" },
]

export function DashboardCharts() {
  return (
    <div className="space-y-6">
      {/* Bar Chart */}
      <div className="bg-card border border-border shadow-card rounded-xl p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey="serviços" fill="#f59e0b" name="Serviços" radius={[4, 4, 0, 0]} />
              <Bar dataKey="concluídos" fill="#16a34a" name="Concluídos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie Chart */}
      <div className="bg-card border border-border shadow-card rounded-xl p-6">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.name} ${((props.percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
