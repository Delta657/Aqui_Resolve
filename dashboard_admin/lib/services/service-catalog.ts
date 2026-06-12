"use client"

import { collection, getDocs, query } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface ServiceCatalogItem {
  id: string
  name: string
  slug: string
  active: boolean
  displayOrder: number
  description: string
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export async function listServiceCatalog(): Promise<ServiceCatalogItem[]> {
  if (!db) {
    return []
  }

  const snapshot = await getDocs(query(collection(db, "service_categories")))

  return snapshot.docs
    .map((snapshotDoc) => {
      const data = snapshotDoc.data()
      const name = String(data.name ?? data.title ?? data.label ?? "Serviço")

      return {
        id: snapshotDoc.id,
        name,
        slug: String(data.slug ?? normalizeSlug(name)),
        active: Boolean(data.active ?? data.isActive ?? data.enabled ?? true),
        displayOrder: Number(data.displayOrder ?? data.order ?? data.sortOrder ?? 0),
        description: String(data.description ?? ""),
      } satisfies ServiceCatalogItem
    })
    .sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1
      }

      return a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "pt-BR")
    })
}
