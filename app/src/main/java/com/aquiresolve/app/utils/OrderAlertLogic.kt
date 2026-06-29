package com.aquiresolve.app.utils

import java.util.Locale

/**
 * Lógica PURA (sem Firebase/Android) das decisões do alerta sonoro de novos pedidos.
 *
 * Centraliza as regras que o [com.aquiresolve.app.ProviderNewOrderAlertManager]
 * e o caminho FCM seguem, para que o comportamento exigido seja testável em JVM:
 *
 *  - Um pedido só "disponível" (distributing/pending/available) entra na oferta.
 *  - O alerta dispara para os pedidos que ficaram disponíveis AGORA (novos), não
 *    para os que já estavam quando o app abriu.
 *  - Se o prestador rejeitou o pedido (está em `rejectedBy`), ele não recebe mais o
 *    alerta daquele pedido — mas os outros prestadores continuam (a rejeição NÃO
 *    muda o status do pedido).
 *  - O som de um pedido PARA quando ele é aceito (status=assigned com prestador) ou
 *    quando sai de "disponível" por qualquer motivo (cancelado/expirado/etc.).
 */
object OrderAlertLogic {

    /** Status (case-insensitive) em que o pedido está aberto para algum prestador aceitar. */
    val AVAILABLE_STATUSES = setOf("distributing", "pending", "available")

    fun isAvailableStatus(status: String?): Boolean {
        val s = status?.trim()?.lowercase(Locale.ROOT) ?: return false
        return s in AVAILABLE_STATUSES
    }

    /** O prestador já rejeitou este pedido? (rejeição é por-prestador, via array `rejectedBy`) */
    fun wasRejectedBy(rejectedBy: List<String>?, providerId: String): Boolean {
        if (providerId.isBlank()) return false
        return rejectedBy?.contains(providerId) == true
    }

    /**
     * IDs que devem disparar alerta agora = os disponíveis para este prestador que
     * ainda não eram conhecidos. Evita re-alertar pedidos do snapshot inicial.
     */
    fun computeNewAlertIds(currentAvailableIds: Set<String>, knownIds: Set<String>): Set<String> {
        return currentAvailableIds - knownIds
    }

    /**
     * O som deste pedido deve PARAR?
     *  - aceito: status=assigned e há um prestador atribuído → para para TODOS.
     *  - não mais disponível: saiu de distributing/pending/available (cancelado,
     *    expirado, em andamento, concluído…) → para para todos.
     * A rejeição por um prestador específico NÃO entra aqui (não muda o status);
     * ela é tratada por-prestador via [wasRejectedBy] + parada local do som.
     */
    fun shouldStopSound(status: String?, assignedProvider: String?): Boolean {
        val s = status?.trim()?.lowercase(Locale.ROOT)
        val accepted = s == "assigned" && !assignedProvider.isNullOrBlank()
        val noLongerAvailable = !isAvailableStatus(status)
        return accepted || noLongerAvailable
    }
}
