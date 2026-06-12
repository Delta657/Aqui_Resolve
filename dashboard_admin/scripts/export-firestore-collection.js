/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")
const admin = require("firebase-admin")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (_error) {
    console.error("FIREBASE_SERVICE_ACCOUNT invalido (JSON mal formatado).")
    return null
  }
}

function initAdmin() {
  if (admin.apps.length > 0) {
    return admin.app()
  }

  const serviceAccount = loadServiceAccount()
  if (!serviceAccount) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT nao encontrado no .env.local")
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  })
}

function usage() {
  console.log("Uso:")
  console.log("  node scripts/export-firestore-collection.js --collection <nome> [--format json|csv] [--out <arquivo>] [--limit <n>]")
  console.log("  node scripts/export-firestore-collection.js <collection> [limit] [format] [out]")
  console.log("")
  console.log("Exemplos:")
  console.log("  node scripts/export-firestore-collection.js --collection orders")
  console.log("  node scripts/export-firestore-collection.js orders 200 csv exports/orders.csv")
  console.log("  node scripts/export-firestore-collection.js --collection orders --format csv --out exports/orders.csv")
  console.log("  node scripts/export-firestore-collection.js --collection orders --limit 200")
}

function parseArgs(argv) {
  const args = {}
  const positionalArgs = []

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (!token.startsWith("--")) {
      positionalArgs.push(token)
      continue
    }

    const [rawKey, inlineValue] = token.split("=")
    const key = rawKey.slice(2)
    const value = inlineValue !== undefined ? inlineValue : argv[index + 1]

    if (inlineValue === undefined) {
      index += 1
    }

    args[key] = value
  }

  if (!args.collection && positionalArgs[0]) {
    args.collection = positionalArgs[0]
  }

  if (!args.limit && positionalArgs[1]) {
    args.limit = positionalArgs[1]
  }

  if (!args.format && positionalArgs[2]) {
    args.format = positionalArgs[2]
  }

  if (!args.out && positionalArgs[3]) {
    args.out = positionalArgs[3]
  }

  return args
}

function buildDefaultOutputPath(collectionName, format) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const safeCollectionName = String(collectionName).replace(/[\\/]/g, "_")
  const fileName = `${safeCollectionName}-${timestamp}.${format}`
  return path.join("exports", fileName)
}

function normalizeFirestoreValue(value) {
  if (value === null || value === undefined) {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === "object" && typeof value.toDate === "function") {
    const date = value.toDate()
    if (date instanceof Date) {
      return date.toISOString()
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeFirestoreValue(item))
  }

  if (typeof value === "object") {
    const normalized = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      normalized[key] = normalizeFirestoreValue(nestedValue)
    }
    return normalized
  }

  return value
}

function flattenRecord(record, parentKey = "", out = {}) {
  if (record === null || record === undefined) {
    if (parentKey) {
      out[parentKey] = ""
    }
    return out
  }

  if (Array.isArray(record)) {
    out[parentKey] = JSON.stringify(record)
    return out
  }

  if (typeof record !== "object") {
    out[parentKey] = record
    return out
  }

  for (const [key, value] of Object.entries(record)) {
    const fullKey = parentKey ? `${parentKey}.${key}` : key

    if (value === null || value === undefined) {
      out[fullKey] = ""
      continue
    }

    if (Array.isArray(value)) {
      out[fullKey] = JSON.stringify(value)
      continue
    }

    if (typeof value === "object") {
      flattenRecord(value, fullKey, out)
      continue
    }

    out[fullKey] = value
  }

  return out
}

function escapeCsvCell(value) {
  if (value === null || value === undefined) {
    return ""
  }

  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`
  }

  return text
}

function rowsToCsv(rows) {
  const flattenedRows = rows.map((row) => flattenRecord(row))
  const headerSet = new Set()

  flattenedRows.forEach((row) => {
    Object.keys(row).forEach((key) => headerSet.add(key))
  })

  const headers = Array.from(headerSet).sort((a, b) => a.localeCompare(b))

  if (headers.includes("id")) {
    headers.splice(headers.indexOf("id"), 1)
    headers.unshift("id")
  }

  const headerLine = headers.join(",")
  const bodyLines = flattenedRows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header])).join(",")
  )

  return [headerLine, ...bodyLines].join("\n")
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))
    const collectionName = args.collection
    const format = String(args.format || "json").toLowerCase()
    const limitRaw = args.limit
    const limit = limitRaw ? Number(limitRaw) : 0

    if (!collectionName) {
      usage()
      throw new Error("Parametro obrigatorio: --collection")
    }

    if (!["json", "csv"].includes(format)) {
      usage()
      throw new Error("Formato invalido. Use --format json ou --format csv.")
    }

    if (limitRaw && (!Number.isFinite(limit) || limit <= 0)) {
      usage()
      throw new Error("Parametro --limit invalido. Informe um numero inteiro maior que 0.")
    }

    initAdmin()
    const db = admin.firestore()
    const query = limit > 0 ? db.collection(collectionName).limit(limit) : db.collection(collectionName)
    const snapshot = await query.get()

    const rows = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...normalizeFirestoreValue(doc.data()),
    }))

    const outputPath = path.resolve(args.out || buildDefaultOutputPath(collectionName, format))
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })

    if (format === "json") {
      fs.writeFileSync(outputPath, JSON.stringify(rows, null, 2), "utf8")
    } else {
      fs.writeFileSync(outputPath, rowsToCsv(rows), "utf8")
    }

    console.log(`Colecao: ${collectionName}`)
    console.log(`Documentos exportados: ${rows.length}`)
    console.log(`Formato: ${format.toUpperCase()}`)
    console.log(`Arquivo: ${outputPath}`)
  } catch (error) {
    console.error("Falha ao exportar colecao:", error.message)
    process.exitCode = 1
  }
}

main()
