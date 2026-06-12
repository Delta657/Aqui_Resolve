"use client"

import { useEffect, useRef } from "react"

export function ServiceMap() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Placeholder for Leaflet map initialization
    // In a real implementation, you would initialize Leaflet here
    if (mapRef.current) {
      // Mock map with service locations
      mapRef.current.innerHTML = `
        <div class="w-full h-full bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
          <div class="absolute inset-0 bg-linear-to-br from-blue-50 to-green-50"></div>
          <div class="relative z-10 text-center text-muted-foreground">
            <div class="text-sm font-medium">Mapa Interativo</div>
            <div class="text-xs mt-1">Localização dos serviços ativos</div>
            <div class="mt-2 text-xs">
              <div class="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></div>
              Vitória - ES
            </div>
          </div>
          <!-- Mock markers -->
          <div class="absolute top-1/4 left-1/3 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute top-1/2 right-1/3 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute bottom-1/3 left-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
      `
    }
  }, [])

  return <div ref={mapRef} className="h-64 w-full" />
}
