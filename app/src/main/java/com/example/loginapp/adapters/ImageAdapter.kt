package com.example.loginapp.adapters

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.example.loginapp.R
import com.example.loginapp.databinding.ItemImageBinding

/**
 * Adapter para exibir lista de imagens
 * 
 * Funcionalidades:
 * - Exibição de imagens do Firebase Storage
 * - Suporte a múltiplas imagens
 * - Clique para visualizar em tela cheia
 * - Indicador de carregamento
 */
class ImageAdapter(
    private val context: Context,
    private var imageUrls: List<String>,
    private val onImageClick: (String, Int) -> Unit = { _, _ -> },
    private val onImageLongClick: (String, Int) -> Unit = { _, _ -> }
) : RecyclerView.Adapter<ImageAdapter.ImageViewHolder>() {

    inner class ImageViewHolder(private val binding: ItemImageBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(imageUrl: String, position: Int) {
            // Configurar opções do Glide
            val requestOptions = RequestOptions()
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .placeholder(R.drawable.ic_photo)
                .error(R.drawable.ic_photo)
                .centerCrop()
            
            // Carregar imagem
            Glide.with(context)
                .load(imageUrl)
                .apply(requestOptions)
                .into(binding.ivImage)
            
            // Configurar clique
            binding.root.setOnClickListener {
                onImageClick(imageUrl, position)
            }
            
            // Configurar clique longo
            binding.root.setOnLongClickListener {
                onImageLongClick(imageUrl, position)
                true
            }
            
            // Mostrar indicador de posição se houver múltiplas imagens
            if (imageUrls.size > 1) {
                binding.tvImageNumber.text = "${position + 1}/${imageUrls.size}"
                binding.tvImageNumber.visibility = View.VISIBLE
            } else {
                binding.tvImageNumber.visibility = View.GONE
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImageViewHolder {
        val binding = ItemImageBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ImageViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ImageViewHolder, position: Int) {
        holder.bind(imageUrls[position], position)
    }

    override fun getItemCount(): Int = imageUrls.size

    /**
     * Atualiza a lista de imagens
     */
    fun updateImages(newImageUrls: List<String>) {
        imageUrls = newImageUrls
        notifyDataSetChanged()
    }

    /**
     * Adiciona uma nova imagem
     */
    fun addImage(imageUrl: String) {
        val newList = imageUrls.toMutableList()
        newList.add(imageUrl)
        imageUrls = newList
        notifyItemInserted(imageUrls.size - 1)
    }

    /**
     * Remove uma imagem
     */
    fun removeImage(position: Int) {
        if (position in 0 until imageUrls.size) {
            val newList = imageUrls.toMutableList()
            newList.removeAt(position)
            imageUrls = newList
            notifyItemRemoved(position)
            notifyItemRangeChanged(position, imageUrls.size)
        }
    }

    /**
     * Obtém URL da imagem na posição
     */
    fun getImageUrl(position: Int): String? {
        return if (position in 0 until imageUrls.size) imageUrls[position] else null
    }
}
