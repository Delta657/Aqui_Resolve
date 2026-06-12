"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    google: any
    initGoogleMaps: () => void
    __googleMapsBlocked?: boolean
    __googleMapsLoadError?: string | null
    __googleMapsScriptLoadingPromise?: Promise<void>
  }
}

interface GoogleMapsLoaderProps {
  apiKey?: string
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-javascript-api"

export function GoogleMapsLoader({ apiKey }: GoogleMapsLoaderProps) {
  useEffect(() => {
    window.__googleMapsBlocked = false
    window.__googleMapsLoadError = null

    const handleMapsError = (event: ErrorEvent) => {
      const message = event?.message || ''
      const knownErrors = [
        'ApiTargetBlockedMapError',
        'RefererNotAllowedMapError',
        'InvalidKeyMapError',
        'BillingNotEnabledMapError',
        'ApiNotActivatedMapError',
      ]

      if (knownErrors.some((knownError) => message.includes(knownError))) {
        window.__googleMapsBlocked = true
        window.__googleMapsLoadError = message
        console.error('Google Maps bloqueado/configurado incorretamente:', message)
      }
    }

    window.addEventListener('error', handleMapsError)

    if (window.google && window.google.maps) {
      return () => window.removeEventListener('error', handleMapsError)
    }

    const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!key || key.trim() === '' || key.includes('your_google_maps_api_key') || key.includes('your_') || key.length < 20) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Google Maps API Key nao configurada ou invalida. Mapa mock sera usado.')
        console.warn('Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no .env.local')
      }
      return () => window.removeEventListener('error', handleMapsError)
    }

    const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null

    if (!window.__googleMapsScriptLoadingPromise) {
      if (existingScript) {
        window.__googleMapsScriptLoadingPromise = new Promise<void>((resolve, reject) => {
          if (window.google?.maps) {
            resolve()
            return
          }

          existingScript.addEventListener('load', () => resolve(), { once: true })
          existingScript.addEventListener('error', () => reject(new Error('Erro ao carregar script do Google Maps')), { once: true })
        })
      } else {
        const script = document.createElement('script')
        script.id = GOOGLE_MAPS_SCRIPT_ID
        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&v=weekly`
        script.async = true
        script.defer = true

        window.__googleMapsScriptLoadingPromise = new Promise<void>((resolve, reject) => {
          script.addEventListener('load', () => {
            if (process.env.NODE_ENV !== 'production') {
              console.log('Google Maps carregado com sucesso')
            }
            resolve()
          }, { once: true })

          script.addEventListener('error', () => {
            window.__googleMapsBlocked = true
            window.__googleMapsLoadError = 'Erro ao carregar script do Google Maps'
            console.error('Erro ao carregar Google Maps. Verifique a chave e as restricoes de API.')
            reject(new Error('Erro ao carregar script do Google Maps'))
          }, { once: true })
        })

        document.head.appendChild(script)
      }
    }

    return () => {
      window.removeEventListener('error', handleMapsError)
    }
  }, [apiKey])

  return null
}

