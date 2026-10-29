package com.aquiresolve.app

import android.app.Activity
import android.app.Application
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.install.model.UpdateAvailability
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import java.util.concurrent.TimeUnit

/**
 * Avisa o usuário quando há versão nova do app.
 *
 * - Google Play (In-App Updates): se a loja tem versão mais nova, mostra um aviso
 *   "Atualizar / Agora não" no máximo uma vez a cada 24 h.
 * - Firestore `app_config/app_version.minVersionCode`: se a versão instalada for
 *   menor, o aviso é OBRIGATÓRIO (não fecha) — usar quando a versão antiga quebra
 *   algo crítico (ex.: pagamento). Campo opcional `message` troca o texto.
 *
 * Instalado uma vez no AppApplication; verifica a cada tela retomada (com cache).
 */
object AppUpdateChecker : Application.ActivityLifecycleCallbacks {

    private const val TAG = "AppUpdateChecker"
    private const val PREFS = "app_update_checker"
    private const val KEY_LAST_PROMPT = "last_optional_prompt_at"
    private val OPTIONAL_PROMPT_INTERVAL_MS = TimeUnit.HOURS.toMillis(24)

    // Resultado do piso de versão: null = ainda não lido (ex.: usuário deslogado).
    private var minVersionCode: Long? = null
    private var forcedMessage: String? = null
    private var playChecked = false
    private var dialog: AlertDialog? = null
    private var dialogOwner: Activity? = null

    fun install(application: Application) {
        application.registerActivityLifecycleCallbacks(this)
    }

    override fun onActivityResumed(activity: Activity) {
        if (activity !is AppCompatActivity) return

        val required = minVersionCode
        if (required != null) {
            if (BuildConfig.VERSION_CODE < required) showForcedDialog(activity)
        } else {
            loadMinVersion(activity)
        }

        if (!playChecked) checkPlayStore(activity)
    }

    private fun loadMinVersion(activity: AppCompatActivity) {
        // A regra de `app_config` exige login; sem usuário tenta de novo na próxima tela.
        if (FirebaseAuth.getInstance().currentUser == null) return

        FirebaseFirestore.getInstance()
            .collection("app_config").document("app_version")
            .get()
            .addOnSuccessListener { doc ->
                minVersionCode = doc.getLong("minVersionCode") ?: 0L
                forcedMessage = doc.getString("message")?.takeIf { it.isNotBlank() }
                if (BuildConfig.VERSION_CODE < (minVersionCode ?: 0L) && isUsable(activity)) {
                    showForcedDialog(activity)
                }
            }
            .addOnFailureListener { e -> Log.w(TAG, "Falha ao ler app_config/app_version: ${e.message}") }
    }

    private fun checkPlayStore(activity: AppCompatActivity) {
        playChecked = true
        AppUpdateManagerFactory.create(activity.applicationContext)
            .appUpdateInfo
            .addOnSuccessListener { info ->
                if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE &&
                    shouldShowOptional(activity) &&
                    isUsable(activity)
                ) {
                    showOptionalDialog(activity)
                }
            }
            // Instalação fora da Play Store (APK de teste) não tem como consultar: ignora.
            .addOnFailureListener { e -> Log.d(TAG, "In-App Updates indisponível: ${e.message}") }
    }

    private fun showOptionalDialog(activity: AppCompatActivity) {
        if (dialog?.isShowing == true) return
        prefs(activity).edit().putLong(KEY_LAST_PROMPT, System.currentTimeMillis()).apply()
        dialogOwner = activity
        dialog = AlertDialog.Builder(activity)
            .setTitle("Nova versão disponível")
            .setMessage("Uma nova versão do Aqui Resolve está disponível na Play Store, com melhorias e correções.")
            .setPositiveButton("Atualizar") { _, _ -> openPlayStore(activity) }
            .setNegativeButton("Agora não", null)
            .show()
    }

    private fun showForcedDialog(activity: AppCompatActivity) {
        if (dialog?.isShowing == true || !isUsable(activity)) return
        dialogOwner = activity
        dialog = AlertDialog.Builder(activity)
            .setTitle("Atualização necessária")
            .setMessage(
                forcedMessage
                    ?: "Esta versão do Aqui Resolve não é mais suportada. Atualize para continuar usando o app."
            )
            .setCancelable(false)
            .setPositiveButton("Atualizar", null)
            .create()
            .also { forced ->
                forced.setOnShowListener {
                    // Abre a loja sem fechar o diálogo: ao voltar, o app continua bloqueado.
                    forced.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener { openPlayStore(activity) }
                }
                forced.show()
            }
    }

    private fun openPlayStore(activity: Activity) {
        val pkg = activity.packageName
        try {
            activity.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg")))
        } catch (_: ActivityNotFoundException) {
            activity.startActivity(
                Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$pkg"))
            )
        }
    }

    private fun shouldShowOptional(context: Context): Boolean {
        val last = prefs(context).getLong(KEY_LAST_PROMPT, 0L)
        return System.currentTimeMillis() - last >= OPTIONAL_PROMPT_INTERVAL_MS
    }

    private fun isUsable(activity: Activity) = !activity.isFinishing && !activity.isDestroyed

    private fun prefs(context: Context) = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    // O diálogo pertence à tela que o abriu: fecha junto para não vazar a janela.
    // O obrigatório volta a aparecer no próximo onActivityResumed.
    override fun onActivityPaused(activity: Activity) {
        if (dialogOwner === activity) {
            dialog?.dismiss()
            dialog = null
            dialogOwner = null
        }
    }

    override fun onActivityCreated(activity: Activity, savedInstanceState: Bundle?) = Unit
    override fun onActivityStarted(activity: Activity) = Unit
    override fun onActivityStopped(activity: Activity) = Unit
    override fun onActivitySaveInstanceState(activity: Activity, outState: Bundle) = Unit
    override fun onActivityDestroyed(activity: Activity) = Unit
}
