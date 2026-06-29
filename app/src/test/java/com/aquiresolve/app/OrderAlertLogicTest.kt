package com.aquiresolve.app

import com.aquiresolve.app.models.OrderData
import com.aquiresolve.app.utils.OrderAlertLogic
import com.aquiresolve.app.utils.ServiceNicheCatalog
import com.aquiresolve.app.utils.TowingDispatch
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Prova as regras do alerta sonoro de novos pedidos (requisito do produto):
 *  - toca para os prestadores do nicho quando um pedido fica disponível;
 *  - para para TODOS quando alguém aceita;
 *  - a recusa de um prestador remove só ele (não muda o status → os outros seguem);
 *  - pedido que sai de "disponível" silencia.
 */
class OrderAlertLogicTest {

    // ---- status de disponibilidade ----

    @Test
    fun availableStatuses_coverDistributingPendingAvailable_caseInsensitive() {
        assertTrue(OrderAlertLogic.isAvailableStatus("distributing"))
        assertTrue(OrderAlertLogic.isAvailableStatus("PENDING"))
        assertTrue(OrderAlertLogic.isAvailableStatus(" Available "))
        assertFalse(OrderAlertLogic.isAvailableStatus("assigned"))
        assertFalse(OrderAlertLogic.isAvailableStatus("completed"))
        assertFalse(OrderAlertLogic.isAvailableStatus(null))
    }

    // ---- recusa é por-prestador ----

    @Test
    fun rejectedBy_isPerProvider() {
        val rejected = listOf("providerX")
        // quem recusou não recebe mais o alerta daquele pedido
        assertTrue(OrderAlertLogic.wasRejectedBy(rejected, "providerX"))
        // os OUTROS continuam recebendo (não estão na lista)
        assertFalse(OrderAlertLogic.wasRejectedBy(rejected, "providerY"))
        assertFalse(OrderAlertLogic.wasRejectedBy(null, "providerX"))
        assertFalse(OrderAlertLogic.wasRejectedBy(emptyList(), "providerX"))
    }

    // ---- só os pedidos NOVOS alertam ----

    @Test
    fun computeNewAlertIds_onlyNewOnesAlert() {
        val known = setOf("a", "b")
        val current = setOf("a", "b", "c", "d")
        assertEquals(setOf("c", "d"), OrderAlertLogic.computeNewAlertIds(current, known))
        // nada novo → nenhum alerta
        assertEquals(emptySet<String>(), OrderAlertLogic.computeNewAlertIds(known, known))
    }

    // ---- parar o som ----

    @Test
    fun shouldStopSound_whenAcceptedByAnyone() {
        // aceite válido: status=assigned com prestador → para para todos
        assertTrue(OrderAlertLogic.shouldStopSound("assigned", "providerZ"))
        // mesmo "assigned" sem prestador já saiu do pool de disponíveis → também para
        assertTrue(OrderAlertLogic.shouldStopSound("assigned", null))
        assertTrue(OrderAlertLogic.shouldStopSound("assigned", ""))
    }

    @Test
    fun shouldStopSound_whenNoLongerAvailable() {
        assertTrue(OrderAlertLogic.shouldStopSound("cancelled", null))
        assertTrue(OrderAlertLogic.shouldStopSound("expired", null))
        assertTrue(OrderAlertLogic.shouldStopSound("in_progress", "p"))
        assertTrue(OrderAlertLogic.shouldStopSound("completed", "p"))
    }

    @Test
    fun shouldNotStopSound_whileStillDistributing_afterAReject() {
        // A recusa de um prestador NÃO muda o status: o pedido segue "distributing",
        // então o som NÃO para para os demais.
        assertFalse(OrderAlertLogic.shouldStopSound("distributing", null))
        assertFalse(OrderAlertLogic.shouldStopSound("pending", null))
    }

    // ---- match de nicho (toca para os prestadores DAQUELE nicho) ----

    @Test
    fun nicheMatch_electrical_matchesProviderOfThatNiche() {
        val providerServices = ServiceNicheCatalog.normalizeProviderServices(listOf("Elétrica"))
        val order = OrderData(serviceName = "Elétrica", serviceType = "Instalação de tomada")
        assertTrue(ServiceNicheCatalog.matchesProviderServices(providerServices, order))
    }

    @Test
    fun nicheMatch_isAccentAndCaseInsensitive() {
        val providerServices = ServiceNicheCatalog.normalizeProviderServices(listOf("eletrica"))
        val order = OrderData(serviceName = "Elétrica")
        assertTrue(ServiceNicheCatalog.matchesProviderServices(providerServices, order))
    }

    @Test
    fun nicheMatch_doesNotMatchOtherNiche() {
        val providerServices = ServiceNicheCatalog.normalizeProviderServices(listOf("Jardinagem"))
        val order = OrderData(serviceName = "Elétrica")
        assertFalse(ServiceNicheCatalog.matchesProviderServices(providerServices, order))
    }

    @Test
    fun nicheMatch_emptyProviderServices_neverMatches() {
        val order = OrderData(serviceName = "Elétrica")
        assertFalse(ServiceNicheCatalog.matchesProviderServices(emptySet(), order))
    }

    // ---- pedido comum (não-guincho) é sempre ofertável ----

    @Test
    fun normalOrder_isAlwaysOfferable_regardlessOfLocation() {
        val order = OrderData(serviceName = "Elétrica")
        assertTrue(TowingDispatch.canOfferToProvider(order, providerLocation = null))
    }
}
