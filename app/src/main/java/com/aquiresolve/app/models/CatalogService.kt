package com.aquiresolve.app.models

/**
 * Serviço do catálogo dinâmico (coleção `catalog_services`), gerido pelo painel admin.
 *
 * Espelha o que o painel grava: nicho + nome + valor ao cliente + % do prestador
 * (e o repasse absoluto já calculado). O app exibe esses serviços/preços e, no checkout,
 * o valor real ainda vem do backend (que lê a mesma coleção) — aqui é exibição.
 */
data class CatalogService(
    val niche: String,
    val name: String,
    val description: String,
    val estimatedTime: String,
    val estimatedPrice: Double,
    val providerCommissionPercent: Int,
    val providerCommission: Double,
    val isConsult: Boolean,
    val active: Boolean,
    val displayOrder: Int
)
