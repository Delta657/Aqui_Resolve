package com.aquiresolve.app.payment

import android.util.Log
import com.aquiresolve.app.BuildConfig
import com.aquiresolve.app.models.payment.CardData
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

/**
 * Tokeniza o cartão direto na Pagar.me com a chave PÚBLICA (Core API v5,
 * `POST /tokens?appId=pk_...`). Assim número e CVV vão do aparelho para a
 * Pagar.me e o nosso backend recebe só o `card_token` (fora do escopo PCI).
 */
class CardTokenizer(
    private val publicKey: String = BuildConfig.PAGARME_PUBLIC_KEY
) {

    companion object {
        private const val TAG = "CardTokenizer"
        private const val TOKENS_URL = "https://api.pagar.me/core/v5/tokens"
        private val JSON = "application/json; charset=utf-8".toMediaType()
    }

    private val client = OkHttpClient.Builder()
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    val isEnabled: Boolean
        get() = publicKey.isNotBlank()

    sealed class Result {
        data class Success(val token: String) : Result()
        data class Error(val message: String) : Result()
    }

    suspend fun tokenize(card: CardData): Result = withContext(Dispatchers.IO) {
        try {
            val expiration = card.cardExpirationDate.filter { it.isDigit() }
            if (expiration.length < 4) {
                return@withContext Result.Error("Data de validade inválida")
            }

            val body = JSONObject()
                .put("type", "card")
                .put(
                    "card",
                    JSONObject()
                        .put("number", card.cardNumber.filter { it.isDigit() })
                        .put("holder_name", card.cardHolderName.trim())
                        .put("exp_month", expiration.substring(0, 2))
                        .put("exp_year", expiration.substring(2, 4))
                        .put("cvv", card.cardCvv.filter { it.isDigit() })
                )

            // Sem header Authorization: a autenticação é só o appId (chave pública).
            val request = Request.Builder()
                .url("$TOKENS_URL?appId=$publicKey")
                .post(body.toString().toRequestBody(JSON))
                .build()

            client.newCall(request).execute().use { response ->
                val raw = response.body?.string().orEmpty()
                val json = runCatching { JSONObject(raw) }.getOrNull()
                val token = json?.optString("id").orEmpty()

                if (response.isSuccessful && token.isNotBlank()) {
                    Result.Success(token)
                } else {
                    Log.w(TAG, "Tokenização recusada: HTTP ${response.code}")
                    Result.Error(extractMessage(json) ?: "Não foi possível validar o cartão")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao tokenizar cartão", e)
            Result.Error("Erro de conexão ao validar o cartão")
        }
    }

    private fun extractMessage(json: JSONObject?): String? {
        json ?: return null
        val errors = json.optJSONObject("errors")
        if (errors != null) {
            val firstKey = errors.keys().asSequence().firstOrNull()
            val detail = firstKey?.let { errors.optJSONArray(it)?.optString(0) }
            if (!detail.isNullOrBlank()) return "Cartão inválido: $detail"
        }
        return json.optString("message").trim().ifBlank { null }
    }
}
