package com.aquiresolve.app.adapters

import android.net.Uri
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.bumptech.glide.Glide

class OsPhotosAdapter(
    private var uris: MutableList<Uri>,
    private val onRemove: (Int) -> Unit,
    private val onAdd: () -> Unit
) : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    companion object {
        private const val TYPE_PHOTO = 0
        private const val TYPE_ADD = 1
    }

    fun updateUris(newUris: List<Uri>) {
        uris = newUris.toMutableList()
        notifyDataSetChanged()
    }

    override fun getItemViewType(position: Int): Int {
        return if (position < uris.size) TYPE_PHOTO else TYPE_ADD
    }

    override fun getItemCount(): Int = uris.size + 1

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        return if (viewType == TYPE_PHOTO) {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_os_photo, parent, false)
            PhotoViewHolder(view)
        } else {
            val view = LayoutInflater.from(parent.context)
                .inflate(R.layout.item_os_photo_add, parent, false)
            AddViewHolder(view)
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        when (holder) {
            is PhotoViewHolder -> {
                val uri = uris[position]
                Glide.with(holder.itemView.context)
                    .load(uri)
                    .centerCrop()
                    .into(holder.ivPhoto)
                holder.btnRemove.setOnClickListener {
                    onRemove(position)
                }
            }
            is AddViewHolder -> {
                holder.itemView.setOnClickListener { onAdd() }
            }
        }
    }

    class PhotoViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val ivPhoto: ImageView = view.findViewById(R.id.ivPhoto)
        val btnRemove: View = view.findViewById(R.id.btnRemove)
    }

    class AddViewHolder(view: View) : RecyclerView.ViewHolder(view)
}
