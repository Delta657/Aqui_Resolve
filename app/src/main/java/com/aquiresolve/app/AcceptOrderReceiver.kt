package com.aquiresolve.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import com.aquiresolve.app.utils.NewOrderSoundHelper
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/**
 * Processa o botão "Aceitar" da notificação de novo pedido.
 */
class AcceptOrderReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AcceptOrderReceiver"
        const val ACTION_ACCEPT_ORDER = "com.aquiresolve.app.ACCEPT_ORDER"
        const val EXTRA_ORDER_ID = "order_id"
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != ACTION_ACCEPT_ORDER) return

        val orderId = intent.getStringExtra(EXTRA_ORDER_ID)
        if (orderId.isNullOrBlank()) {
            Log.w(TAG, "Nenhum orderId recebido no intent de aceite")
            return
        }

        val pendingResult = goAsync()
        scope.launch {
            try {
                if (!FirebaseConfig.isInitialized()) {
                    FirebaseConfig.initialize(context.applicationContext)
                }

                val result = FirebaseOrderManager().acceptOrderAsProvider(orderId)
                if (result.isSuccess) {
                    NewOrderSoundHelper.stopSound(orderId)
                    ProviderNewOrderAlertManager.refreshMonitoring()
                    ProviderLocationForegroundService.start(context.applicationContext)

                    val detailsIntent = Intent(context, OrderDetailsActivity::class.java).apply {
                        putExtra("order_id", orderId)
                        putExtra("is_provider_view", true)
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                    }
                    context.startActivity(detailsIntent)
                    Log.d(TAG, "Pedido aceito pela notificação: $orderId")
                } else {
                    val message = result.exceptionOrNull()?.message ?: "erro desconhecido"
                    Log.e(TAG, "Erro ao aceitar pedido $orderId: $message")
                    launch(Dispatchers.Main) {
                        Toast.makeText(context, "Não foi possível aceitar: $message", Toast.LENGTH_LONG).show()
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Falha ao aceitar pedido $orderId", e)
                launch(Dispatchers.Main) {
                    Toast.makeText(context, "Erro ao aceitar pedido: ${e.message}", Toast.LENGTH_LONG).show()
                }
            } finally {
                pendingResult.finish()
            }
        }
    }
}
