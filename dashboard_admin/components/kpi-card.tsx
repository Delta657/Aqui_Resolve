"use client"

import { LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface KPICardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: LucideIcon
  variant?: "orange" | "green" | "blue" | "red"
  className?: string
}

export function KPICard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "orange",
  className,
}: KPICardProps) {
  const variantClasses = {
    orange: "kpi-card-orange",
    green: "kpi-card-green",
    blue: "kpi-card-blue",
    red: "kpi-card-red",
  }

  const changeColorClasses = {
    positive: "text-green-100",
    negative: "text-red-100",
    neutral: "text-white/80",
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/80">
          {title}
        </CardTitle>
        <div className={cn("p-2 rounded-lg", variantClasses[variant])}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {change && (
          <p className={cn("text-xs", changeColorClasses[changeType])}>
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
