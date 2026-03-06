package com.aquiresolve.app.adapters

import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ImageButton
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.bumptech.glide.Glide

/**
 * Adapter para lista de imagens selecionadas
 * 
 * Funcionalidades:
 * - Exibir preview das imagens
 * - Remover imagens da lista
 * - Indicar tipo de documento (RG, CPF, etc.)
 * - Compressão automática
 */
class ImagesAdapter(
    private val images: MutableList<ImageItem>,
    private val onImageClick: (ImageItem, Int) -> Unit,
    private val onRemoveClick: (ImageItem, Int) -> Unit
) : RecyclerView.Adapter<ImagesAdapter.ImageViewHolder>() {

    /**
     * Item de imagem com metadados
     */
    data class ImageItem(
        val uri: Uri,
        val type: ImageType = ImageType.GENERAL,
        val fileName: String? = null,
        val fileSize: Long = 0,
        val isCompressed: Boolean = false
    )

    /**
     * Tipos de imagem/documento
     */
    enum class ImageType {
        GENERAL,    // Imagem geral
        RG,         // Documento de identidade
        CPF,        // CPF
        ADDRESS,    // Comprovante de endereço
        SERVICE     // Imagem do serviço
    }

    class ImageViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val ivImage: ImageView = itemView.findViewById(R.id.ivImage)
        val tvImageNumber: android.widget.TextView = itemView.findViewById(R.id.tvImageNumber)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImageViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_image, parent, false)
        return ImageViewHolder(view)
    }

    override fun onBindViewHolder(holder: ImageViewHolder, position: Int) {
        val imageItem = images[position]
        
        // Carregar imagem com Glide
        Glide.with(holder.itemView.context)
            .load(imageItem.uri)
            .placeholder(R.drawable.ic_add_photo)
            .error(R.drawable.ic_add_photo)
            .centerCrop()
            .into(holder.ivImage)
        
        // Configurar número da imagem
        holder.tvImageNumber.text = "${position + 1}/${images.size}"
        holder.tvImageNumber.visibility = if (images.size > 1) View.VISIBLE else View.GONE
        
        // Configurar click listeners
        holder.itemView.setOnClickListener {
            onImageClick(imageItem, position)
        }
        
        // Remover botão não disponível no layout atual
    }

    override fun getItemCount(): Int = images.size

    // Métodos removidos pois os elementos não existem no layout atual

    /**
     * Adiciona uma nova imagem à lista
     */
    fun addImage(imageItem: ImageItem) {
        images.add(imageItem)
        notifyItemInserted(images.size - 1)
    }

    /**
     * Remove uma imagem da lista
     */
    fun removeImage(position: Int) {
        if (position in 0 until images.size) {
            images.removeAt(position)
            notifyItemRemoved(position)
            notifyItemRangeChanged(position, images.size)
        }
    }

    /**
     * Atualiza uma imagem na lista
     */
    fun updateImage(position: Int, imageItem: ImageItem) {
        if (position in 0 until images.size) {
            images[position] = imageItem
            notifyItemChanged(position)
        }
    }

    /**
     * Obtém todas as imagens
     */
    fun getImages(): List<ImageItem> = images.toList()

    /**
     * Obtém URIs das imagens
     */
    fun getImageUris(): List<Uri> = images.map { it.uri }

    /**
     * Limpa a lista de imagens
     */
    fun clearImages() {
        val size = images.size
        images.clear()
        notifyItemRangeRemoved(0, size)
    }

    /**
     * Verifica se há imagens na lista
     */
    fun hasImages(): Boolean = images.isNotEmpty()

    /**
     * Obtém o número de imagens
     */
    fun getImageCount(): Int = images.size
} 