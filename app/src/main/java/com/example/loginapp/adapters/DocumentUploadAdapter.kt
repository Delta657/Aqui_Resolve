package com.example.loginapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.loginapp.R
import com.example.loginapp.ProviderVerificationManager
import com.example.loginapp.models.DocumentUploadItem
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import java.text.SimpleDateFormat
import java.util.*

/**
 * Adapter para lista de upload de documentos
 * 
 * Funcionalidades:
 * - Exibe documentos obrigatórios e opcionais
 * - Mostra status de upload e validação
 * - Permite remoção e retry de documentos
 * - Preview de documentos enviados
 */
class DocumentUploadAdapter(
    private val documents: MutableList<DocumentUploadItem>,
    private val onDocumentClick: (DocumentUploadItem) -> Unit,
    private val onRemoveClick: (DocumentUploadItem) -> Unit,
    private val onRetryClick: (DocumentUploadItem) -> Unit
) : RecyclerView.Adapter<DocumentUploadAdapter.DocumentViewHolder>() {

    companion object {
        private const val DATE_FORMAT = "dd/MM/yyyy HH:mm"
    }

    private val dateFormatter = SimpleDateFormat(DATE_FORMAT, Locale("pt", "BR"))

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): DocumentViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_document_upload, parent, false)
        return DocumentViewHolder(view)
    }

    override fun onBindViewHolder(holder: DocumentViewHolder, position: Int) {
        val document = documents[position]
        holder.bind(document)
    }

    override fun getItemCount(): Int = documents.size

    /**
     * Atualiza documento na lista
     */
    fun updateDocument(document: DocumentUploadItem) {
        val index = documents.indexOfFirst { it.type == document.type }
        if (index != -1) {
            documents[index] = document
            notifyItemChanged(index)
        }
    }

    /**
     * Remove documento da lista
     */
    fun removeDocument(document: DocumentUploadItem) {
        val index = documents.indexOfFirst { it.id == document.id }
        if (index != -1) {
            documents.removeAt(index)
            notifyItemRemoved(index)
        }
    }

    /**
     * ViewHolder para item de documento
     */
    inner class DocumentViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val ivDocumentIcon: ImageView = itemView.findViewById(R.id.ivDocumentIcon)
        private val tvDocumentName: TextView = itemView.findViewById(R.id.tvDocumentName)
        private val tvDocumentDescription: TextView = itemView.findViewById(R.id.tvDocumentDescription)
        private val tvDocumentStatus: TextView = itemView.findViewById(R.id.tvDocumentStatus)
        private val tvUploadDate: TextView = itemView.findViewById(R.id.tvUploadDate)
        private val tvFileSize: TextView = itemView.findViewById(R.id.tvFileSize)
        private val progressBar: ProgressBar = itemView.findViewById(R.id.progressBar)
        private val btnRemove: ImageView = itemView.findViewById(R.id.btnRemove)
        private val btnRetry: ImageView = itemView.findViewById(R.id.btnRetry)
        private val ivStatusIcon: ImageView = itemView.findViewById(R.id.ivStatusIcon)

        fun bind(document: DocumentUploadItem) {
            // Configurar nome e descrição
            tvDocumentName.text = document.type.displayName
            tvDocumentDescription.text = document.type.description

            // Configurar ícone baseado no tipo
            val iconRes = when (document.type) {
                ProviderVerificationManager.DocumentType.RG_FRONT,
                ProviderVerificationManager.DocumentType.RG_BACK,
                ProviderVerificationManager.DocumentType.CNH_FRONT,
                ProviderVerificationManager.DocumentType.CNH_BACK -> R.drawable.ic_id_card
                ProviderVerificationManager.DocumentType.SELFIE -> R.drawable.ic_selfie
                ProviderVerificationManager.DocumentType.PROOF_OF_ADDRESS -> R.drawable.ic_home
                ProviderVerificationManager.DocumentType.BANK_STATEMENT -> R.drawable.ic_bank
                ProviderVerificationManager.DocumentType.WORK_CERTIFICATE -> R.drawable.ic_work
            }
            ivDocumentIcon.setImageResource(iconRes)

            // Configurar status
            when (document.status) {
                DocumentUploadItem.Status.PENDING -> {
                    tvDocumentStatus.text = "Aguardando upload"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.warning_color))
                    ivStatusIcon.setImageResource(R.drawable.ic_pending)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                    tvUploadDate.visibility = View.GONE
                    tvFileSize.visibility = View.GONE
                }
                DocumentUploadItem.Status.SELECTED -> {
                    tvDocumentStatus.text = "Selecionado (não enviado)"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.info_color))
                    // Reusar ícone existente para evitar dependência de novo recurso
                    ivStatusIcon.setImageResource(R.drawable.ic_upload)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.GONE
                    tvUploadDate.visibility = View.GONE
                    tvFileSize.visibility = View.VISIBLE
                }
                DocumentUploadItem.Status.UPLOADED -> {
                    tvDocumentStatus.text = "Enviado"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.info_color))
                    ivStatusIcon.setImageResource(R.drawable.ic_upload)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.GONE
                    tvUploadDate.visibility = View.VISIBLE
                    tvFileSize.visibility = View.VISIBLE
                }
                DocumentUploadItem.Status.SUBMITTED -> {
                    tvDocumentStatus.text = "Enviado para verificação"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.info_color))
                    // Reusar ícone existente
                    ivStatusIcon.setImageResource(R.drawable.ic_upload)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                    tvUploadDate.visibility = View.VISIBLE
                    tvFileSize.visibility = View.VISIBLE
                }
                DocumentUploadItem.Status.VALIDATED -> {
                    tvDocumentStatus.text = "Validado"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.success_color))
                    ivStatusIcon.setImageResource(R.drawable.ic_check_circle)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                    tvUploadDate.visibility = View.VISIBLE
                    tvFileSize.visibility = View.VISIBLE
                }
                DocumentUploadItem.Status.REJECTED -> {
                    tvDocumentStatus.text = "Rejeitado"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.error_color))
                    ivStatusIcon.setImageResource(R.drawable.ic_error)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.VISIBLE
                    tvUploadDate.visibility = View.VISIBLE
                    tvFileSize.visibility = View.VISIBLE
                }
                DocumentUploadItem.Status.ERROR -> {
                    tvDocumentStatus.text = "Erro no upload"
                    tvDocumentStatus.setTextColor(itemView.context.getColor(R.color.error_color))
                    ivStatusIcon.setImageResource(R.drawable.ic_error)
                    progressBar.visibility = View.GONE
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.VISIBLE
                    tvUploadDate.visibility = View.GONE
                    tvFileSize.visibility = View.GONE
                }
            }

            // Configurar data de upload
            if (document.uploadedAt != null) {
                tvUploadDate.text = "Enviado em: ${dateFormatter.format(document.uploadedAt)}"
                tvUploadDate.visibility = View.VISIBLE
            } else {
                tvUploadDate.visibility = View.GONE
            }

            // Configurar tamanho do arquivo
            if (document.fileSize > 0) {
                tvFileSize.text = formatFileSize(document.fileSize)
                tvFileSize.visibility = View.VISIBLE
            } else {
                tvFileSize.visibility = View.GONE
            }

            // Configurar nome do arquivo se disponível
            if (document.fileName.isNotEmpty()) {
                tvDocumentName.text = document.fileName
            }

            // Configurar listeners
            itemView.setOnClickListener {
                if (document.status != DocumentUploadItem.Status.PENDING) {
                    onDocumentClick(document)
                }
            }

            btnRemove.setOnClickListener {
                onRemoveClick(document)
            }

            btnRetry.setOnClickListener {
                onRetryClick(document)
            }

            // Configurar visibilidade dos botões baseado no status (exhaustivo)
            when (document.status) {
                DocumentUploadItem.Status.PENDING -> {
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                }
                DocumentUploadItem.Status.SELECTED -> {
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.GONE
                }
                DocumentUploadItem.Status.UPLOADED -> {
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.GONE
                }
                DocumentUploadItem.Status.SUBMITTED -> {
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                }
                DocumentUploadItem.Status.VALIDATED -> {
                    btnRemove.visibility = View.GONE
                    btnRetry.visibility = View.GONE
                }
                DocumentUploadItem.Status.REJECTED,
                DocumentUploadItem.Status.ERROR -> {
                    btnRemove.visibility = View.VISIBLE
                    btnRetry.visibility = View.VISIBLE
                }
            }
        }

        /**
         * Formata tamanho do arquivo
         */
        private fun formatFileSize(bytes: Long): String {
            val kb = bytes / 1024.0
            val mb = kb / 1024.0
            val gb = mb / 1024.0

            return when {
                gb >= 1 -> "%.1f GB".format(gb)
                mb >= 1 -> "%.1f MB".format(mb)
                kb >= 1 -> "%.1f KB".format(kb)
                else -> "$bytes B"
            }
        }
    }
}