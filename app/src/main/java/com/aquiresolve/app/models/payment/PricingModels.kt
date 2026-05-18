package com.aquiresolve.app.models.payment

import com.google.gson.annotations.SerializedName

data class PricingRequest(
    @SerializedName("category")
    val category: String,
    @SerializedName("serviceType")
    val serviceType: String
)

data class PricingResponse(
    @SerializedName("category")
    val category: String,
    @SerializedName("serviceType")
    val serviceType: String,
    @SerializedName("estimatedPrice")
    val estimatedPrice: Double,
    @SerializedName("providerCommission")
    val providerCommission: Double,
    @SerializedName("source")
    val source: String? = null
)
