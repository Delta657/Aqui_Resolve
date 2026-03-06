package com.aquiresolve.app.utils

import kotlin.random.Random

/**
 * Gerador de nomes de usuário aleatórios
 * 
 * Gera nomes de usuário únicos e amigáveis para novos usuários
 */
object UsernameGenerator {
    
    // Prefixos para nomes de usuário
    private val prefixes = listOf(
        "user", "cliente", "visitante", "membro", "usuario", "perfil", "conta"
    )
    
    // Sufixos para nomes de usuário
    private val suffixes = listOf(
        "2024", "2025", "pro", "plus", "vip", "gold", "silver", "new", "cool", "top"
    )
    
    // Adjetivos para tornar o nome mais interessante
    private val adjectives = listOf(
        "feliz", "brilhante", "criativo", "energico", "paciente", "amigavel", 
        "inteligente", "talentoso", "dedicado", "organizado", "confiante", "otimista"
    )
    
    /**
     * Gera um nome de usuário aleatório único
     * 
     * @return Nome de usuário gerado
     */
    fun generateUsername(): String {
        val random = Random.Default
        
        // Escolher um padrão de geração
        val pattern = random.nextInt(4)
        
        return when (pattern) {
            0 -> generateSimpleUsername(random)
            1 -> generateAdjectiveUsername(random)
            2 -> generateNumberUsername(random)
            else -> generateMixedUsername(random)
        }
    }
    
    /**
     * Gera um nome de usuário simples (prefixo + número)
     */
    private fun generateSimpleUsername(random: Random): String {
        val prefix = prefixes.random(random)
        val number = random.nextInt(1000, 9999)
        return "${prefix}_${number}"
    }
    
    /**
     * Gera um nome de usuário com adjetivo
     */
    private fun generateAdjectiveUsername(random: Random): String {
        val adjective = adjectives.random(random)
        val number = random.nextInt(10, 999)
        return "${adjective}_${number}"
    }
    
    /**
     * Gera um nome de usuário com número grande
     */
    private fun generateNumberUsername(random: Random): String {
        val prefix = prefixes.random(random)
        val number = random.nextInt(10000, 99999)
        return "${prefix}${number}"
    }
    
    /**
     * Gera um nome de usuário misto
     */
    private fun generateMixedUsername(random: Random): String {
        val prefix = prefixes.random(random)
        val suffix = suffixes.random(random)
        val number = random.nextInt(100, 999)
        return "${prefix}_${suffix}_${number}"
    }
    
    /**
     * Gera múltiplos nomes de usuário para escolha
     * 
     * @param count Número de opções a gerar
     * @return Lista de nomes de usuário únicos
     */
    fun generateMultipleUsernames(count: Int = 3): List<String> {
        val usernames = mutableSetOf<String>()
        while (usernames.size < count) {
            usernames.add(generateUsername())
        }
        return usernames.toList()
    }
}
