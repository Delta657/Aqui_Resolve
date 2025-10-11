package com.example.loginapp.utils

/**
 * Utilitário para estados brasileiros
 */
object BrazilianStates {
    
    /**
     * Lista de estados brasileiros com sigla e nome
     */
    val states = listOf(
        "AC" to "Acre",
        "AL" to "Alagoas", 
        "AP" to "Amapá",
        "AM" to "Amazonas",
        "BA" to "Bahia",
        "CE" to "Ceará",
        "DF" to "Distrito Federal",
        "ES" to "Espírito Santo",
        "GO" to "Goiás",
        "MA" to "Maranhão",
        "MT" to "Mato Grosso",
        "MS" to "Mato Grosso do Sul",
        "MG" to "Minas Gerais",
        "PA" to "Pará",
        "PB" to "Paraíba",
        "PR" to "Paraná",
        "PE" to "Pernambuco",
        "PI" to "Piauí",
        "RJ" to "Rio de Janeiro",
        "RN" to "Rio Grande do Norte",
        "RS" to "Rio Grande do Sul",
        "RO" to "Rondônia",
        "RR" to "Roraima",
        "SC" to "Santa Catarina",
        "SP" to "São Paulo",
        "SE" to "Sergipe",
        "TO" to "Tocantins"
    )
    
    /**
     * Obtém apenas as siglas dos estados
     */
    fun getStateCodes(): List<String> = states.map { it.first }
    
    /**
     * Obtém apenas os nomes dos estados
     */
    fun getStateNames(): List<String> = states.map { it.second }
    
    /**
     * Obtém o nome do estado pela sigla
     */
    fun getStateNameByCode(code: String): String? {
        return states.find { it.first == code }?.second
    }
    
    /**
     * Obtém a sigla do estado pelo nome
     */
    fun getStateCodeByName(name: String): String? {
        return states.find { it.second == name }?.first
    }
    
    /**
     * Obtém lista formatada para spinners (Sigla - Nome)
     */
    fun getFormattedStates(): List<String> = states.map { "${it.first} - ${it.second}" }
    
    /**
     * Valida se uma sigla de estado é válida
     */
    fun isValidStateCode(code: String): Boolean {
        return states.any { it.first == code }
    }
    
    /**
     * Valida se um nome de estado é válido
     */
    fun isValidStateName(name: String): Boolean {
        return states.any { it.second == name }
    }
}


