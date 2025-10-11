package com.example.loginapp.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.loginapp.R
import com.example.loginapp.databinding.ItemServiceCategoryBinding
import com.example.loginapp.models.ServiceCategory

/**
 * Adapter para categorias de serviços
 */
class ServiceCategoriesAdapter(
    private var categories: List<ServiceCategory>,
    private val onCategoryClick: (ServiceCategory) -> Unit
) : RecyclerView.Adapter<ServiceCategoriesAdapter.CategoryViewHolder>() {

    inner class CategoryViewHolder(private val binding: ItemServiceCategoryBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(category: ServiceCategory) {
            binding.tvCategoryName.text = category.name
            
            // Definir ícone baseado no nome da categoria
            val iconRes = when (category.name.lowercase()) {
                "limpeza" -> R.drawable.ic_cleaning
                "manutenção" -> R.drawable.ic_carpentry
                "elétrica" -> R.drawable.ic_electrician
                "encanamento" -> R.drawable.ic_plumber
                "pintura" -> R.drawable.ic_painter
                "jardinagem" -> R.drawable.ic_gardening
                "mudanças" -> R.drawable.ic_moving
                "tecnologia" -> R.drawable.ic_it
                "carpintaria" -> R.drawable.ic_carpentry
                else -> R.drawable.ic_services
            }
            
            binding.ivCategoryIcon.setImageResource(iconRes)
            
            // Click listener
            itemView.setOnClickListener { onCategoryClick(category) }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CategoryViewHolder {
        val binding = ItemServiceCategoryBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CategoryViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CategoryViewHolder, position: Int) {
        holder.bind(categories[position])
    }

    override fun getItemCount(): Int = categories.size
    
    /**
     * Atualiza a lista de categorias
     */
    fun updateCategories(newCategories: List<ServiceCategory>) {
        categories = newCategories
        notifyDataSetChanged()
    }
}


