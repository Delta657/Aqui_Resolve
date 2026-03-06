package com.aquiresolve.app.adapters

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.aquiresolve.app.databinding.ItemServiceTypeBinding
import com.aquiresolve.app.models.ServiceType
import com.aquiresolve.app.models.FavoriteType
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.aquiresolve.app.FirebaseServiceManager

/**
 * Adapter para tipos de serviços
 */
class ServiceTypesAdapter(
    private var serviceTypes: List<ServiceType>,
    private val onServiceClick: (ServiceType) -> Unit,
    private val onFavoriteClick: (ServiceType, Boolean) -> Unit,
    private val serviceManager: FirebaseServiceManager
) : RecyclerView.Adapter<ServiceTypesAdapter.ServiceViewHolder>() {

    private val auth = FirebaseAuth.getInstance()
    private val scope = CoroutineScope(Dispatchers.Main)

    inner class ServiceViewHolder(private val binding: ItemServiceTypeBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(serviceType: ServiceType) {
            binding.tvServiceName.text = serviceType.name
            binding.tvServiceDescription.text = serviceType.description
            
            // Definir ícone baseado no nome do serviço
            val iconRes = when {
                serviceType.name.lowercase().contains("elétric") -> R.drawable.ic_electrician
                serviceType.name.lowercase().contains("encanamento") || serviceType.name.lowercase().contains("desentupimento") -> R.drawable.ic_plumber
                serviceType.name.lowercase().contains("limpeza") -> R.drawable.ic_cleaning
                serviceType.name.lowercase().contains("pintura") -> R.drawable.ic_painter
                serviceType.name.lowercase().contains("jardim") || serviceType.name.lowercase().contains("paisagismo") -> R.drawable.ic_gardening
                serviceType.name.lowercase().contains("ti") || serviceType.name.lowercase().contains("câmera") -> R.drawable.ic_it
                serviceType.name.lowercase().contains("móvel") || serviceType.name.lowercase().contains("prateleira") -> R.drawable.ic_carpentry
                serviceType.name.lowercase().contains("mudança") -> R.drawable.ic_moving
                else -> R.drawable.ic_services
            }
            
            binding.ivServiceIcon.setImageResource(iconRes)
            
            // Preço estimado
            if (serviceType.estimatedPrice > 0) {
                binding.tvServicePrice.text = "A partir de R$ ${serviceType.estimatedPrice.toInt()}"
            } else {
                binding.tvServicePrice.text = "Preço sob consulta"
            }
            
            // Verificar se é favorito
            checkFavoriteStatus(serviceType)
            
            // Click listeners
            binding.btnRequestService.setOnClickListener { onServiceClick(serviceType) }
            binding.ivFavorite.setOnClickListener { 
                toggleFavorite(serviceType)
            }
        }
        
        private fun checkFavoriteStatus(serviceType: ServiceType) {
            val currentUser = auth.currentUser
            if (currentUser != null) {
                scope.launch {
                    val isFavorite = serviceManager.isFavorite(
                        currentUser.uid, 
                        serviceType.id
                    )
                    updateFavoriteIcon(isFavorite)
                }
            }
        }
        
        private fun toggleFavorite(serviceType: ServiceType) {
            val currentUser = auth.currentUser
            if (currentUser != null) {
                scope.launch {
                    val isCurrentlyFavorite = serviceManager.isFavorite(
                        currentUser.uid, 
                        serviceType.id
                    )
                    
                    if (isCurrentlyFavorite) {
                        // Remover favorito
                        val result = serviceManager.removeFavorite(
                            currentUser.uid, 
                            serviceType.id
                        )
                        if (result.isSuccess) {
                            updateFavoriteIcon(false)
                            onFavoriteClick(serviceType, false)
                        }
                    } else {
                        // Adicionar favorito
                        val result = serviceManager.addFavorite(
                            userId = currentUser.uid,
                            type = FavoriteType.SERVICE,
                            itemId = serviceType.id,
                            itemName = serviceType.name,
                            itemDescription = serviceType.description
                        )
                        if (result.isSuccess) {
                            updateFavoriteIcon(true)
                            onFavoriteClick(serviceType, true)
                        }
                    }
                }
            }
        }
        
        private fun updateFavoriteIcon(isFavorite: Boolean) {
            if (isFavorite) {
                binding.ivFavorite.setImageResource(R.drawable.ic_favorite)
                binding.ivFavorite.setColorFilter(ContextCompat.getColor(binding.root.context, R.color.error_red))
            } else {
                binding.ivFavorite.setImageResource(R.drawable.ic_favorite)
                binding.ivFavorite.setColorFilter(ContextCompat.getColor(binding.root.context, R.color.text_secondary))
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ServiceViewHolder {
        val binding = ItemServiceTypeBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ServiceViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ServiceViewHolder, position: Int) {
        holder.bind(serviceTypes[position])
    }

    override fun getItemCount(): Int = serviceTypes.size
    
    /**
     * Atualiza a lista de serviços
     */
    fun updateServices(newServices: List<ServiceType>) {
        serviceTypes = newServices
        notifyDataSetChanged()
    }
}
