package com.example.loginapp.adapters

import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.example.loginapp.R
import com.bumptech.glide.Glide
import com.github.chrisbanes.photoview.PhotoView

/**
 * Adapter para ViewPager de preview de imagens
 * 
 * Funcionalidades:
 * - Visualização em tela cheia
 * - Zoom e pan com PhotoView
 * - Carregamento otimizado com Glide
 */
class ImagePreviewAdapter(
    private val images: List<ImageItem>
) : RecyclerView.Adapter<ImagePreviewAdapter.ImagePreviewViewHolder>() {

    /**
     * Item de imagem para preview
     */
    data class ImageItem(
        val uri: Uri,
        val fileName: String? = null,
        val fileSize: Long = 0L,
        val type: String = "GENERAL"
    )

    class ImagePreviewViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val photoView: PhotoView = itemView.findViewById(R.id.photoView)
        val ivPlaceholder: ImageView = itemView.findViewById(R.id.ivPlaceholder)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ImagePreviewViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_image_preview, parent, false)
        return ImagePreviewViewHolder(view)
    }

    override fun onBindViewHolder(holder: ImagePreviewViewHolder, position: Int) {
        val imageItem = images[position]
        
        // Configurar PhotoView
        holder.photoView.setOnClickListener {
            // Toggle de visibilidade dos controles (implementar se necessário)
        }
        
        // Carregar imagem com Glide
        Glide.with(holder.itemView.context)
            .load(imageItem.uri)
            .placeholder(R.drawable.ic_add_photo)
            .error(R.drawable.ic_add_photo)
            .into(holder.photoView)
    }

    override fun getItemCount(): Int = images.size
} 