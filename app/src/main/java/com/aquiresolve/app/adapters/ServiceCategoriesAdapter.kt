package com.aquiresolve.app.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.aquiresolve.app.databinding.ItemServiceCategoryBinding

class ServiceCategoriesAdapter(
    private var niches: List<NicheItem>,
    private val onNicheClick: (NicheItem) -> Unit
) : RecyclerView.Adapter<ServiceCategoriesAdapter.NicheViewHolder>() {

    data class NicheItem(val name: String, val icon: String)

    inner class NicheViewHolder(private val binding: ItemServiceCategoryBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(item: NicheItem) {
            binding.tvCategoryName.text = item.name
            binding.ivCategoryIcon.setImageResource(resolveIcon(item.icon))
            itemView.setOnClickListener { onNicheClick(item) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NicheViewHolder {
        val binding = ItemServiceCategoryBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return NicheViewHolder(binding)
    }

    override fun onBindViewHolder(holder: NicheViewHolder, position: Int) =
        holder.bind(niches[position])

    override fun getItemCount(): Int = niches.size

    fun updateNiches(newNiches: List<NicheItem>) {
        niches = newNiches
        notifyDataSetChanged()
    }

    companion object {
        fun resolveIcon(slug: String): Int = when (slug.trim().lowercase()) {
            "electrician", "zap", "eletrica", "eletrico" -> R.drawable.ic_electrician
            "plumber", "droplets", "encanador", "hidraulica" -> R.drawable.ic_plumber
            "hammer", "instalacao", "installation" -> R.drawable.ic_carpentry
            "waves", "unclog", "desentupimento" -> R.drawable.ic_plumber
            "search", "leak", "caca-vazamentos", "cacavazamentos" -> R.drawable.ic_search
            "sparkles", "cleaning", "limpeza", "sofa", "estofados" -> R.drawable.ic_cleaning
            "wind", "ac", "ar-condicionado", "arcondicionado" -> R.drawable.ic_wind
            "tv", "appliances", "eletrodomesticos" -> R.drawable.ic_appliances
            "lock", "key", "chaveiro" -> R.drawable.ic_lock
            "car", "automotive", "automotivo", "servicos-automotivos" -> R.drawable.ic_car
            "package", "furniture", "moveis", "montagem" -> R.drawable.ic_carpentry
            "truck", "towing", "guincho" -> R.drawable.ic_truck
            "paintbrush", "paint", "pintura" -> R.drawable.ic_painter
            "flower", "garden", "jardinagem" -> R.drawable.ic_gardening
            "move", "moving", "mudanca", "mudancas" -> R.drawable.ic_moving
            "home", "casa" -> R.drawable.ic_home
            "settings", "manutencao" -> R.drawable.ic_settings
            "briefcase", "work", "trabalho" -> R.drawable.ic_work
            "water", "droplet", "agua", "caixa-dagua" -> R.drawable.ic_plumber
            "faxina" -> R.drawable.ic_cleaning
            else -> R.drawable.ic_services
        }
    }
}
