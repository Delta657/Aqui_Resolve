package com.aquiresolve.app.models

import com.google.firebase.Timestamp
import com.google.firebase.firestore.Exclude
import com.google.firebase.firestore.GeoPoint
import com.google.firebase.firestore.PropertyName

/**
 * Modelo para endereços salvos do cliente
 */
data class SavedAddress(
    @PropertyName("id")
    val id: String = "",
    @PropertyName("clientId")
    val clientId: String = "",
    @PropertyName("userType")
    val userType: String = USER_TYPE_CLIENT,
    @PropertyName("name")
    val name: String = "", // Nome personalizado do endereço (ex: "Casa", "Trabalho")
    @PropertyName("address")
    val address: String = "",
    @PropertyName("complement")
    val complement: String = "",
    @PropertyName("neighborhood")
    val neighborhood: String = "",
    @PropertyName("city")
    val city: String = "",
    @PropertyName("state")
    val state: String = "",
    @PropertyName("zipCode")
    val zipCode: String = "",
    @PropertyName("coordinates")
    val coordinates: GeoPoint? = null,
    // ✅ BUG-02: sem os use-site targets @get/@set, o getter Kotlin `isDefault()` era
    // serializado como o campo `default` (convenção bean "is" → ""), enquanto a leitura e
    // as queries (`whereEqualTo("isDefault", true)`) usavam `isDefault` — o endereço padrão
    // nunca sobrevivia ao round-trip. Os targets forçam o nome de campo `isDefault` na
    // escrita E na leitura, mantendo tudo consistente.
    @get:PropertyName("isDefault")
    @set:PropertyName("isDefault")
    var isDefault: Boolean = false,
    @PropertyName("createdAt")
    val createdAt: Timestamp = Timestamp.now(),
    @PropertyName("updatedAt")
    val updatedAt: Timestamp = Timestamp.now()
) {
    /**
     * Retorna o endereço completo formatado.
     * ✅ BUG-02: @Exclude impede que este getter computado seja serializado como o
     * campo `fullAddress` no Firestore (gerava warning "No setter/field for fullAddress"
     * na leitura). É derivado dos demais campos — não precisa ser persistido.
     */
    @Exclude
    fun getFullAddress(): String {
        val parts = mutableListOf<String>()
        
        if (address.isNotEmpty()) parts.add(address)
        if (complement.isNotEmpty()) parts.add(complement)
        if (neighborhood.isNotEmpty()) parts.add(neighborhood)
        if (city.isNotEmpty()) parts.add(city)
        if (state.isNotEmpty()) parts.add(state)
        if (zipCode.isNotEmpty()) parts.add(zipCode)
        
        return parts.joinToString(", ")
    }
    
    /**
     * Retorna o endereço resumido para exibição em listas.
     * ✅ BUG-02: @Exclude impede a serialização como campo `shortAddress` (idem acima).
     */
    @Exclude
    fun getShortAddress(): String {
        val parts = mutableListOf<String>()
        
        if (address.isNotEmpty()) parts.add(address)
        if (neighborhood.isNotEmpty()) parts.add(neighborhood)
        if (city.isNotEmpty()) parts.add(city)
        
        return parts.joinToString(", ")
    }
    
    companion object {
        const val COLLECTION_NAME = "saved_addresses"
        const val USER_TYPE_CLIENT = "CLIENT"
        const val USER_TYPE_PROVIDER = "PROVIDER"
    }
}


