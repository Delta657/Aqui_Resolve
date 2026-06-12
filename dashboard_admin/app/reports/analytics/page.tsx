import { redirect } from "next/navigation"

interface AnalyticsPageProps {
  searchParams?: {
    tab?: string | string[]
  }
}

const legacyTabMap: Record<string, string> = {
  performance: "performance",
  evolution: "analytics",
  payments: "analytics",
  insights: "analytics",
  financial: "overview",
}

export default function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const incomingTab = Array.isArray(searchParams?.tab) ? searchParams?.tab[0] : searchParams?.tab
  const mappedTab = incomingTab ? legacyTabMap[incomingTab] || "analytics" : "analytics"

  redirect(`/reports?tab=${mappedTab}`)
}
