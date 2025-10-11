package com.example.loginapp.models

import android.net.Uri
import com.example.loginapp.ProviderVerificationManager
import java.util.*

/**
 * Item de documento para upload
 * 
 * Representa um documento que precisa ser enviado para verificação
 * do prestador de serviço.
 */
data class DocumentUploadItem(
    val id: String = "",
    val type: ProviderVerificationManager.DocumentType,
    val fileName: String = "",
    val fileSize: Long = 0,
    val fileUri: Uri? = null,
    val status: Status = Status.PENDING,
    val uploadedAt: Date? = null,
    val validationNotes: String? = null
) {
    /**
     * Status do documento
     */
    enum class Status {
        PENDING,        // Aguardando seleção
        SELECTED,       // Selecionado localmente (ainda não enviado)
        UPLOADED,       // Enviado para o Storage
        SUBMITTED,      // Enviado para verificação (bloqueado)
        VALIDATED,      // Validado pela administração
        REJECTED,       // Rejeitado pela administração
        ERROR           // Erro no upload
    }
}