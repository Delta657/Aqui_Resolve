// Cache em memória — persiste entre renders, não faz chamadas repetidas para o mesmo CEP/endereço
const _cache = new Map<string, { lat: number; lng: number }>()

async function geocodeQuery(query: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  if (_cache.has(query)) return _cache.get(query)!

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=br&language=pt-BR&key=${apiKey}`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 'OK' || !data.results?.[0]) return null

    const { lat, lng } = data.results[0].geometry.location
    const coords = { lat, lng }
    _cache.set(query, coords)
    return coords
  } catch {
    return null
  }
}

export interface GeocodableProvider {
  id: string
  cep?: string
  cidade?: string
  logradouro?: string
  localizacao: { lat: number; lng: number }
}

/**
 * Geocodifica prestadores sem coordenadas GPS usando CEP ou endereço via Google Maps.
 * Retorna Map<providerId, { lat, lng }> apenas para os que foram geocodificados.
 */
export async function geocodeProviders(
  providers: GeocodableProvider[],
  apiKey: string
): Promise<Map<string, { lat: number; lng: number }>> {
  const result = new Map<string, { lat: number; lng: number }>()
  if (!apiKey) return result

  const needsGeocode = providers.filter(
    p => p.localizacao.lat === 0 && p.localizacao.lng === 0 && (p.cep || p.cidade)
  )

  // Processar em paralelo com limite de 5 simultâneos para não estourar quota
  const BATCH = 5
  for (let i = 0; i < needsGeocode.length; i += BATCH) {
    const batch = needsGeocode.slice(i, i + BATCH)
    await Promise.all(batch.map(async (p) => {
      // Tenta CEP primeiro (mais preciso), depois endereço completo
      const queries = [
        p.cep ? `${p.cep}, Brasil` : null,
        p.logradouro && p.cidade ? `${p.logradouro}, ${p.cidade}, ES, Brasil` : null,
        p.cidade ? `${p.cidade}, ES, Brasil` : null,
      ].filter(Boolean) as string[]

      for (const q of queries) {
        const coords = await geocodeQuery(q, apiKey)
        if (coords) {
          result.set(p.id, coords)
          return
        }
      }
    }))
  }

  return result
}
