package com.aquiresolve.app.utils

import com.aquiresolve.app.TowingOrderActivity
import com.aquiresolve.app.models.OrderData
import com.google.firebase.firestore.GeoPoint
import kotlin.math.asin
import kotlin.math.cos
import kotlin.math.min
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * Dispatch do GUINCHO por RAIO EXPANSIVO. O pedido começa sendo oferecido apenas
 * aos guincheiros num raio de 10 km da ORIGEM; a cada 4 minutos sem ninguém
 * aceitar, o raio cresce +5 km (15, 20, 25…) até um teto. Assim o guincheiro mais
 * próximo tem a primeira chance e o pedido nunca fica órfão.
 *
 * O raio atual é função PURA do tempo decorrido desde o início da distribuição
 * (`confirmedAt` — carimbado pelo backend quando o pagamento confirma e o pedido
 * vira `distributing`). Por ser determinístico no tempo, todo app calcula o mesmo
 * raio sem precisar de estado central nem de escrita no Firestore.
 */
object TowingDispatch {

    const val START_RADIUS_KM = 10.0
    const val STEP_KM = 5.0
    const val INTERVAL_MS = 4L * 60L * 1000L // 4 minutos por degrau
    const val MAX_RADIUS_KM = 100.0
    private const val EARTH_RADIUS_KM = 6371.0

    /** Identifica pedidos de guincho pela categoria/tipo de serviço. */
    fun isTowingOrder(order: OrderData): Boolean =
        TowingOrderActivity.isTowingCategory(order.serviceType) ||
            TowingOrderActivity.isTowingCategory(order.serviceName)

    private fun dispatchStartMillis(order: OrderData): Long {
        val ts = order.confirmedAt ?: order.distributionStartedAt
        return ts.toDate().time
    }

    /** Raio (km) que o pedido alcança neste instante, segundo o tempo decorrido. */
    fun currentRadiusKm(order: OrderData, nowMillis: Long = System.currentTimeMillis()): Double {
        val start = dispatchStartMillis(order)
        if (start <= 0L) return MAX_RADIUS_KM
        val elapsed = (nowMillis - start).coerceAtLeast(0L)
        val steps = elapsed / INTERVAL_MS
        return min(MAX_RADIUS_KM, START_RADIUS_KM + STEP_KM * steps)
    }

    /** Distância em km entre dois pontos (Haversine). */
    fun distanceKm(a: GeoPoint, b: GeoPoint): Double {
        val dLat = Math.toRadians(b.latitude - a.latitude)
        val dLon = Math.toRadians(b.longitude - a.longitude)
        val lat1 = Math.toRadians(a.latitude)
        val lat2 = Math.toRadians(b.latitude)
        val h = sin(dLat / 2).pow(2) + cos(lat1) * cos(lat2) * sin(dLon / 2).pow(2)
        return 2 * EARTH_RADIUS_KM * asin(min(1.0, sqrt(h)))
    }

    /**
     * Decide se o pedido pode ser oferecido a um prestador NESTA localização agora.
     * - Não-guincho: sempre `true` (não afeta os demais serviços).
     * - Guincho: exige a localização do prestador e que a distância até a origem
     *   esteja dentro do raio atual. Sem localização do prestador → `false` (guincho
     *   depende de GPS ligado, que o prestador online já mantém atualizado).
     * - Guincho sem origem no pedido → `true` (não há como gatear; não bloqueia).
     */
    fun canOfferToProvider(
        order: OrderData,
        providerLocation: GeoPoint?,
        nowMillis: Long = System.currentTimeMillis()
    ): Boolean {
        if (!isTowingOrder(order)) return true
        val origin = order.coordinates ?: return true
        val loc = providerLocation ?: return false
        return distanceKm(loc, origin) <= currentRadiusKm(order, nowMillis)
    }
}
