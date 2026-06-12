"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

const diskData = [
  { name: "Livre", value: 75, color: "#3b82f6" },
  { name: "Utilizado", value: 25, color: "#ef4444" },
]

const financialData = [
  { name: "Despesas", value: 30, color: "#ef4444" },
  { name: "Receitas", value: 50, color: "#16a34a" },
  { name: "Balanço", value: 20, color: "#3b82f6" },
]

export function FinancialChart() {
  return (
    <div className="space-y-6">
      {/* Disk Usage */}
      <div>
        <h4 className="text-sm font-medium mb-2">Espaço em Disco Utilizado</h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={diskData} cx="50%" cy="50%" innerRadius={20} outerRadius={40} dataKey="value">
                {diskData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Livre</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Utilizado</span>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <div className="flex items-center space-x-4 text-xs mb-2">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Despesas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Receitas</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Balanço</span>
          </div>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>0.001k</div>
          <div>0.0005k</div>
          <div>0k</div>
          <div>-0.0005k</div>
          <div>-0.001k</div>
        </div>
      </div>
    </div>
  )
}
