package com.example.loginapp

import android.content.Context
import android.net.Uri
import android.util.Log
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.storage.FirebaseStorage
import kotlinx.coroutines.tasks.await
import java.util.*

/**
 * Gerenciador de verificação de prestadores
 * 
 * Funcionalidades:
 * - Upload de documentos obrigatórios (RG, foto do rosto)
 * - Validação de documentos
 * - Acompanhamento do status de verificação
 * - Notificações de aprovação/rejeição
 */
class ProviderVerificationManager {
    
    private val db = FirebaseFirestore.getInstance()
    private val storage = FirebaseStorage.getInstance()
    
    companion object {
        private const val TAG = "ProviderVerificationManager"
        private const val VERIFICATIONS_COLLECTION = "provider_verifications"
        private const val DOCUMENTS_COLLECTION = "provider_documents"
    }
    
    /**
     * Tipos de documentos para verificação
     */
    enum class DocumentType(
        val displayName: String,
        val required: Boolean,
        val description: String,
        val maxSizeMB: Int = 10
    ) {
        RG_FRONT("RG (Frente)", false, "Documento de identidade - lado da foto", 5),
        RG_BACK("RG (Verso)", false, "Documento de identidade - lado dos dados", 5),
        CNH_FRONT("CNH (Frente)", false, "Carteira de motorista - frente", 5),
        CNH_BACK("CNH (Verso)", false, "Carteira de motorista - verso", 5),
        SELFIE("Foto do Rosto", true, "Selfie com documento em mãos (reconhecimento facial)", 3),
        PROOF_OF_ADDRESS("Comprovante de Residência", false, "Conta de luz, água ou telefone", 5),
        BANK_STATEMENT("Extrato Bancário", false, "Comprovante de conta bancária", 5),
        WORK_CERTIFICATE("Certidão de Trabalho", false, "Comprovante de experiência", 5)
    }
    
    /**
     * Status de verificação
     */
    enum class VerificationStatus {
        PENDING,        // Aguardando documentos
        UNDER_REVIEW,   // Em análise
        APPROVED,       // Aprovado
        REJECTED,       // Rejeitado
        EXPIRED         // Expirado
    }
    
    /**
     * Status de documento
     */
    enum class DocumentStatus {
        PENDING,        // Aguardando upload
        UPLOADED,       // Enviado
        VALIDATED,      // Validado
        REJECTED,       // Rejeitado
        EXPIRED         // Expirado
    }
    
    /**
     * Dados de verificação
     */
    data class VerificationData(
        val id: String = "",
        val providerId: String = "",
        val status: VerificationStatus = VerificationStatus.PENDING,
        val submittedAt: Date? = null,
        val reviewedAt: Date? = null,
        val reviewedBy: String? = null,
        val rejectionReason: String? = null,
        val notes: String = "",
        val createdAt: Date = Date(),
        val expiresAt: Date = Date(System.currentTimeMillis() + (30 * 24 * 60 * 60 * 1000L)) // 30 dias
    )
    
    /**
     * Dados de documento
     */
    data class DocumentData(
        val id: String = "",
        val verificationId: String = "",
        val providerId: String = "",
        val type: DocumentType,
        val fileName: String = "",
        val fileSize: Long = 0,
        val fileUri: String = "",
        val status: DocumentStatus = DocumentStatus.PENDING,
        val uploadedAt: Date? = null,
        val validatedAt: Date? = null,
        val validationNotes: String = "",
        val rejectionReason: String = ""
    )
    
    /**
     * Resultado de operações
     */
    sealed class VerificationResult {
        object Success : VerificationResult()
        data class VerificationCreated(val verificationId: String) : VerificationResult()
        data class Error(val message: String) : VerificationResult()
    }
    
    /**
     * Inicia processo de verificação
     */
    suspend fun startVerification(providerId: String): VerificationResult {
        return try {
            Log.d(TAG, "Iniciando verificação para prestador: $providerId")
            
            // Verificar se já existe verificação ativa
            val existingVerification = getVerificationStatus(providerId)
            if (existingVerification != null && existingVerification.status != VerificationStatus.EXPIRED) {
                Log.d(TAG, "Verificação já existe: ${existingVerification.id}")
                return VerificationResult.Success
            }
            
            // Criar nova verificação
            val verificationId = db.collection(VERIFICATIONS_COLLECTION).document().id
            val verificationData = VerificationData(
                id = verificationId,
                providerId = providerId,
                status = VerificationStatus.PENDING
            )
            
            // Salvar no Firestore
            db.collection(VERIFICATIONS_COLLECTION)
                .document(verificationId)
                .set(verificationData)
                .await()
            
            Log.d(TAG, "Verificação criada: $verificationId")
            VerificationResult.VerificationCreated(verificationId)
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao iniciar verificação: ${e.message}")
            VerificationResult.Error("Erro ao iniciar verificação: ${e.message}")
        }
    }
    
    /**
     * Obtém status da verificação
     */
    suspend fun getVerificationStatus(providerId: String): VerificationData? {
        return try {
            // Consulta sem orderBy para não exigir índice composto
            val snapshot = db.collection(VERIFICATIONS_COLLECTION)
                .whereEqualTo("providerId", providerId)
                .get()
                .await()

            if (snapshot.isEmpty) {
                null
            } else {
                // Selecionar manualmente a verificação mais recente por createdAt
                val mostRecentDoc = snapshot.documents.maxByOrNull { doc ->
                    doc.getDate("createdAt")?.time ?: 0L
                } ?: snapshot.documents.first()

                VerificationData(
                    id = mostRecentDoc.id,
                    providerId = mostRecentDoc.getString("providerId") ?: "",
                    status = when (mostRecentDoc.getString("status")) {
                        "PENDING" -> VerificationStatus.PENDING
                        "UNDER_REVIEW" -> VerificationStatus.UNDER_REVIEW
                        "APPROVED" -> VerificationStatus.APPROVED
                        "REJECTED" -> VerificationStatus.REJECTED
                        "EXPIRED" -> VerificationStatus.EXPIRED
                        else -> VerificationStatus.PENDING
                    },
                    submittedAt = mostRecentDoc.getDate("submittedAt"),
                    reviewedAt = mostRecentDoc.getDate("reviewedAt"),
                    reviewedBy = mostRecentDoc.getString("reviewedBy"),
                    rejectionReason = mostRecentDoc.getString("rejectionReason"),
                    notes = mostRecentDoc.getString("notes") ?: "",
                    createdAt = mostRecentDoc.getDate("createdAt") ?: Date(),
                    expiresAt = mostRecentDoc.getDate("expiresAt") ?: Date()
                )
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao obter status da verificação: ${e.message}")
            null
        }
    }
    
    /**
     * Upload de documento usando FirebaseImageManager (mesma abordagem dos pedidos)
     */
    suspend fun uploadDocument(
        context: android.content.Context,
        providerId: String,
        documentType: DocumentType,
        fileName: String,
        fileSize: Long,
        fileUri: Uri
    ): VerificationResult {
        return try {
            Log.d(TAG, "Iniciando upload de documento: $documentType para prestador: $providerId")
            
            // Garantir que exista uma verificação ativa; caso não exista, cria
            var verification = getVerificationStatus(providerId)
            if (verification == null) {
                when (val createResult = startVerification(providerId)) {
                    is VerificationResult.VerificationCreated -> {
                        verification = getVerificationStatus(providerId)
                    }
                    else -> {
                        // segue sem verificação (permitir upload mesmo assim)
                        verification = null
                    }
                }
            }
            
            // Validar arquivo
            val validationError = validateDocument(fileName, fileSize, documentType)
            if (validationError != null) {
                return VerificationResult.Error(validationError)
            }
            
            // Upload usando FirebaseImageManager (mesma abordagem dos pedidos)
            // Salvar sempre em Documentos/{userId}/...
            val folderName = FirebaseImageManager.FOLDER_DOCUMENTOS
            
            val imageManager = FirebaseImageManager()
            val uploadData = FirebaseImageManager.ImageUploadData(
                uri = fileUri,
                fileName = fileName,
                folder = folderName,
                userId = providerId,
                metadata = mapOf(
                    "documentType" to documentType.name,
                    "providerId" to providerId,
                    "verificationId" to (verification?.id ?: "")
                )
            )
            
            val uploadResult = imageManager.uploadImage(context, uploadData)
            val downloadUrl = when (uploadResult) {
                is FirebaseImageManager.UploadResult.Success -> uploadResult.downloadUrl
                is FirebaseImageManager.UploadResult.Error -> return VerificationResult.Error(uploadResult.message)
                else -> return VerificationResult.Error("Erro no upload")
            }
            
            // Salvar dados do documento no Firestore
            val documentId = db.collection(DOCUMENTS_COLLECTION).document().id
            val documentData = DocumentData(
                id = documentId,
                verificationId = verification?.id ?: "",
                providerId = providerId,
                type = documentType,
                fileName = fileName,
                fileSize = fileSize,
                fileUri = downloadUrl.toString(),
                status = DocumentStatus.UPLOADED,
                uploadedAt = Date()
            )
            
            db.collection(DOCUMENTS_COLLECTION)
                .document(documentId)
                .set(documentData)
                .await()
            
            Log.d(TAG, "Documento enviado com sucesso: $documentId")
            VerificationResult.Success
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao fazer upload do documento: ${e.message}")
            VerificationResult.Error("Erro ao enviar documento: ${e.message}")
        }
    }
    
    /**
     * Obtém documentos do prestador
     */
    suspend fun getProviderDocuments(providerId: String): List<DocumentData> {
        return try {
            val snapshot = db.collection(DOCUMENTS_COLLECTION)
                .whereEqualTo("providerId", providerId)
                .get()
                .await()
            
            snapshot.documents.mapNotNull { doc ->
                try {
                    DocumentData(
                        id = doc.id,
                        verificationId = doc.getString("verificationId") ?: "",
                        providerId = doc.getString("providerId") ?: "",
                        type = DocumentType.valueOf(doc.getString("type") ?: ""),
                        fileName = doc.getString("fileName") ?: "",
                        fileSize = doc.getLong("fileSize") ?: 0,
                        fileUri = doc.getString("fileUri") ?: "",
                        status = when (doc.getString("status")) {
                            "PENDING" -> DocumentStatus.PENDING
                            "UPLOADED" -> DocumentStatus.UPLOADED
                            "VALIDATED" -> DocumentStatus.VALIDATED
                            "REJECTED" -> DocumentStatus.REJECTED
                            "EXPIRED" -> DocumentStatus.EXPIRED
                            else -> DocumentStatus.PENDING
                        },
                        uploadedAt = doc.getDate("uploadedAt"),
                        validatedAt = doc.getDate("validatedAt"),
                        validationNotes = doc.getString("validationNotes") ?: "",
                        rejectionReason = doc.getString("rejectionReason") ?: ""
                    )
                } catch (e: Exception) {
                    Log.e(TAG, "Erro ao processar documento: ${e.message}")
                    null
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao obter documentos: ${e.message}")
            emptyList()
        }
    }
    
    /**
     * Submete verificação para análise
     */
    suspend fun submitForReview(providerId: String): VerificationResult {
        return try {
            Log.d(TAG, "Submetendo verificação para análise: $providerId")
            
            val verification = getVerificationStatus(providerId)
            if (verification == null) {
                return VerificationResult.Error("Verificação não encontrada")
            }
            
            // Verificar se todos os documentos obrigatórios foram enviados
            val documents = getProviderDocuments(providerId)
            // Regras: SELFIE obrigatória + (RG frente/verso) OU (CNH frente/verso)
            val hasSelfie = documents.any { it.type == DocumentType.SELFIE && it.status == DocumentStatus.UPLOADED }
            val hasRgPair = documents.any { it.type == DocumentType.RG_FRONT && it.status == DocumentStatus.UPLOADED } &&
                    documents.any { it.type == DocumentType.RG_BACK && it.status == DocumentStatus.UPLOADED }
            val hasCnhPair = documents.any { it.type == DocumentType.CNH_FRONT && it.status == DocumentStatus.UPLOADED } &&
                    documents.any { it.type == DocumentType.CNH_BACK && it.status == DocumentStatus.UPLOADED }

            if (!hasSelfie || !(hasRgPair || hasCnhPair)) {
                return VerificationResult.Error("Envie SELFIE e RG (frente/verso) OU CNH (frente/verso) para continuar")
            }
            
            // Atualizar status da verificação
            db.collection(VERIFICATIONS_COLLECTION)
                .document(verification.id)
                .update(
                    mapOf(
                        "status" to "UNDER_REVIEW",
                        "submittedAt" to Date()
                    )
                )
                .await()
            
            Log.d(TAG, "Verificação submetida para análise: ${verification.id}")
            VerificationResult.Success
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao submeter verificação: ${e.message}")
            VerificationResult.Error("Erro ao submeter verificação: ${e.message}")
        }
    }
    
    /**
     * Remove documento
     */
    suspend fun removeDocument(documentId: String): VerificationResult {
        return try {
            Log.d(TAG, "Removendo documento: $documentId")
            
            // Obter dados do documento
            val doc = db.collection(DOCUMENTS_COLLECTION)
                .document(documentId)
                .get()
                .await()
            
            if (!doc.exists()) {
                return VerificationResult.Error("Documento não encontrado")
            }
            
            // Remover do Firestore
            db.collection(DOCUMENTS_COLLECTION)
                .document(documentId)
                .delete()
                .await()
            
            // Remover do Storage (opcional - pode manter para auditoria)
            val fileUri = doc.getString("fileUri")
            if (!fileUri.isNullOrEmpty()) {
                try {
                    val storageRef = storage.getReferenceFromUrl(fileUri)
                    storageRef.delete().await()
                } catch (e: Exception) {
                    Log.w(TAG, "Erro ao remover arquivo do storage: ${e.message}")
                }
            }
            
            Log.d(TAG, "Documento removido: $documentId")
            VerificationResult.Success
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao remover documento: ${e.message}")
            VerificationResult.Error("Erro ao remover documento: ${e.message}")
        }
    }
    
    /**
     * Valida documento
     */
    private fun validateDocument(
        fileName: String,
        fileSize: Long,
        documentType: DocumentType
    ): String? {
        // Verificar tamanho
        val maxSizeBytes = documentType.maxSizeMB * 1024 * 1024
        if (fileSize > maxSizeBytes) {
            return "Arquivo muito grande. Máximo ${documentType.maxSizeMB}MB para ${documentType.displayName}"
        }
        
        // Verificar extensão
        val allowedExtensions = listOf("jpg", "jpeg", "png", "pdf")
        val fileExtension = fileName.substringAfterLast(".", "").lowercase()
        if (fileExtension !in allowedExtensions) {
            return "Formato não suportado. Use JPG, PNG ou PDF"
        }
        
        // Validações específicas por tipo
        when (documentType) {
            DocumentType.SELFIE -> {
                if (fileExtension == "pdf") {
                    return "Foto do rosto deve ser uma imagem (JPG ou PNG)"
                }
            }
            DocumentType.RG_FRONT, DocumentType.RG_BACK -> {
                if (fileExtension == "pdf") {
                    return "RG deve ser uma imagem (JPG ou PNG)"
                }
            }
            else -> {
                // PDF é aceito para outros documentos
            }
        }
        
        return null
    }
    
    /**
     * Aprova verificação (admin)
     */
    suspend fun approveVerification(
        verificationId: String,
        adminId: String,
        notes: String = ""
    ): VerificationResult {
        return try {
            Log.d(TAG, "Aprovando verificação: $verificationId")
            
            db.collection(VERIFICATIONS_COLLECTION)
                .document(verificationId)
                .update(
                    mapOf(
                        "status" to "APPROVED",
                        "reviewedAt" to Date(),
                        "reviewedBy" to adminId,
                        "notes" to notes
                    )
                )
                .await()
            
            // Atualizar status dos documentos
            val documents = db.collection(DOCUMENTS_COLLECTION)
                .whereEqualTo("verificationId", verificationId)
                .get()
                .await()
            
            documents.documents.forEach { doc ->
                doc.reference.update(
                    mapOf(
                        "status" to "VALIDATED",
                        "validatedAt" to Date()
                    )
                ).await()
            }
            
            Log.d(TAG, "Verificação aprovada: $verificationId")
            VerificationResult.Success
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao aprovar verificação: ${e.message}")
            VerificationResult.Error("Erro ao aprovar verificação: ${e.message}")
        }
    }
    
    /**
     * Rejeita verificação (admin)
     */
    suspend fun rejectVerification(
        verificationId: String,
        adminId: String,
        reason: String,
        notes: String = ""
    ): VerificationResult {
        return try {
            Log.d(TAG, "Rejeitando verificação: $verificationId")
            
            db.collection(VERIFICATIONS_COLLECTION)
                .document(verificationId)
                .update(
                    mapOf(
                        "status" to "REJECTED",
                        "reviewedAt" to Date(),
                        "reviewedBy" to adminId,
                        "rejectionReason" to reason,
                        "notes" to notes
                    )
                )
                .await()
            
            Log.d(TAG, "Verificação rejeitada: $verificationId")
            VerificationResult.Success
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao rejeitar verificação: ${e.message}")
            VerificationResult.Error("Erro ao rejeitar verificação: ${e.message}")
        }
    }
}