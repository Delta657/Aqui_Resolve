import assert from "node:assert/strict"
import {
  computeMonitorSignals,
  haversineKm,
  isMonitorableStatus,
  monitorPhase,
  toMillis,
  IDLE_AFTER_ACCEPT_MS,
  LOCATION_STALE_MS,
  NO_PROVIDER_STUCK_MS,
} from "../lib/order-monitoring"

const NOW = 1_700_000_000_000

// ── toMillis aceita os formatos que o Firestore/SDK produzem ──
assert.equal(toMillis(null), null)
assert.equal(toMillis(NOW), NOW)
assert.equal(toMillis({ seconds: 1700 }), 1_700_000)
assert.equal(toMillis({ _seconds: 1700 }), 1_700_000)
assert.equal(toMillis({ toMillis: () => 42 }), 42)

// ── haversine: ~1.11 km por 0.01° de latitude ──
const d = haversineKm(-15.6, -56.1, -15.61, -56.1)
assert.ok(d > 1.0 && d < 1.2, `esperado ~1.11km, veio ${d}`)

// ── status monitorável ──
assert.equal(isMonitorableStatus("in_progress"), true)
assert.equal(isMonitorableStatus("distributing"), true)
assert.equal(isMonitorableStatus("completed"), false)
assert.equal(isMonitorableStatus("cancelled"), false)

assert.equal(monitorPhase("distributing", null), "awaiting")
assert.equal(monitorPhase("assigned", "p1"), "assigned")
assert.equal(monitorPhase("in_progress", "p1"), "active")

// ── pedido saudável: pago, atribuído, localização fresca, deslocando ──
const healthy = computeMonitorSignals({
  status: "in_progress",
  paymentStatus: "paid",
  providerId: "p1",
  createdMs: NOW - 5 * 60_000,
  acceptedMs: NOW - 4 * 60_000,
  orderLat: -15.6,
  orderLng: -56.1,
  live: { lat: -15.61, lng: -56.1, lastLocationUpdate: NOW - 30_000 },
  baseline: { ms: NOW - 4 * 60_000, lat: -15.7, lng: -56.2 },
  now: NOW,
})
assert.equal(healthy.alert, false, "pedido saudável não deve alertar")
assert.equal(healthy.worst, "ok")
assert.ok(healthy.distanceKm != null && healthy.distanceKm > 1)

// ── ociosidade por localização parada (stale) durante atendimento ──
const stale = computeMonitorSignals({
  status: "assigned",
  paymentStatus: "paid",
  providerId: "p1",
  acceptedMs: NOW - (IDLE_AFTER_ACCEPT_MS + 60_000),
  live: { lat: -15.7, lng: -56.2, lastLocationUpdate: NOW - (LOCATION_STALE_MS + 60_000) },
  now: NOW,
})
assert.equal(stale.alert, true, "localização parada deve alertar")
assert.ok(stale.signals.some((s) => s.tone === "bad" && s.label.includes("Localização parada")))

// ── ociosidade por NÃO deslocamento: aceitou há tempo, fresco, mas não saiu do lugar ──
const notMoved = computeMonitorSignals({
  status: "assigned",
  paymentStatus: "paid",
  providerId: "p1",
  acceptedMs: NOW - (IDLE_AFTER_ACCEPT_MS + 120_000),
  orderLat: -15.6,
  orderLng: -56.1,
  // localização fresca, mas igual à baseline (não andou)
  live: { lat: -15.70001, lng: -56.20001, lastLocationUpdate: NOW - 20_000 },
  baseline: { ms: NOW - (IDLE_AFTER_ACCEPT_MS + 120_000), lat: -15.7, lng: -56.2 },
  now: NOW,
})
assert.equal(notMoved.alert, true, "prestador que não se deslocou deve alertar")
assert.ok(notMoved.signals.some((s) => s.label.includes("não se deslocou")))

// ── prestador que acabou de aceitar e ainda não moveu NÃO deve alertar (sem tempo) ──
const justAccepted = computeMonitorSignals({
  status: "assigned",
  paymentStatus: "paid",
  providerId: "p1",
  acceptedMs: NOW - 60_000,
  live: { lat: -15.7, lng: -56.2, lastLocationUpdate: NOW - 10_000 },
  baseline: { ms: NOW - 60_000, lat: -15.7, lng: -56.2 },
  now: NOW,
})
assert.equal(justAccepted.alert, false, "recém-aceito não deve alertar por ociosidade")

// ── sem prestador há muito tempo na distribuição → alerta ──
const noProvider = computeMonitorSignals({
  status: "distributing",
  paymentStatus: "paid",
  providerId: null,
  createdMs: NOW - (NO_PROVIDER_STUCK_MS + 60_000),
  now: NOW,
})
assert.equal(noProvider.alert, true, "sem prestador há muito tempo deve alertar")

console.log("order-monitoring: testes concluídos")
