package com.aquiresolve.app.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.aquiresolve.app.databinding.ItemServiceProviderBinding
import com.aquiresolve.app.models.ServiceProvider
import com.aquiresolve.app.models.FavoriteType
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import com.aquiresolve.app.FirebaseServiceManager

/**
 * Adapter para prestadores de serviços
 */
class ServiceProvidersAdapter(
    private var providers: List<ServiceProvider>,
    private val onProviderClick: (ServiceProvider) -> Unit,
    private val onFavoriteClick: (ServiceProvider, Boolean) -> Unit,
    private val serviceManager: FirebaseServiceManager
) : RecyclerView.Adapter<ServiceProvidersAdapter.ProviderViewHolder>() {

    private val auth = FirebaseAuth.getInstance()
    private val scope = CoroutineScope(Dispatchers.Main)

    inner class ProviderViewHolder(private val binding: ItemServiceProviderBinding) : RecyclerView.ViewHolder(binding.root) {
        
        fun bind(provider: ServiceProvider) {
            binding.tvProviderName.text = provider.name
            binding.tvProviderBio.text = provider.bio.ifEmpty { "Prestador de serviços profissional" }
            binding.tvProviderRating.text = String.format("%.1f", provider.rating)
            binding.tvCompletedOrders.text = "${provider.completedOrders} pedidos"
            
            // Mostrar badge de verificado se aplicável
            if (provider.isVerified) {
                binding.verifiedBadge.visibility = View.VISIBLE
            } else {
                binding.verifiedBadge.visibility = View.GONE
            }
            
            // Verificar se é favorito
            checkFavoriteStatus(provider)
            
            // Click listeners
            binding.btnContactProvider.setOnClickListener { onProviderClick(provider) }
            binding.ivFavorite.setOnClickListener { 
                toggleFavorite(provider)
            }
        }
        
        private fun checkFavoriteStatus(provider: ServiceProvider) {
            val currentUser = auth.currentUser
            if (currentUser != null) {
                scope.launch {
                    val isFavorite = serviceManager.isFavorite(
                        currentUser.uid, 
                        provider.id
                    )
                    updateFavoriteIcon(isFavorite)
                }
            }
        }
        
        private fun toggleFavorite(provider: ServiceProvider) {
            val currentUser = auth.currentUser
            if (currentUser != null) {
                scope.launch {
                    val isCurrentlyFavorite = serviceManager.isFavorite(
                        currentUser.uid, 
                        provider.id
                    )
                    
                    if (isCurrentlyFavorite) {
                        // Remover favorito
                        val result = serviceManager.removeFavorite(
                            currentUser.uid, 
                            provider.id
                        )
                        if (result.isSuccess) {
                            updateFavoriteIcon(false)
                            onFavoriteClick(provider, false)
                        }
                    } else {
                        // Adicionar favorito
                        val result = serviceManager.addFavorite(
                            userId = currentUser.uid,
                            type = FavoriteType.PROVIDER,
                            itemId = provider.id,
                            itemName = provider.name,
                            itemDescription = provider.bio.ifEmpty { "Prestador de serviços" }
                        )
                        if (result.isSuccess) {
                            updateFavoriteIcon(true)
                            onFavoriteClick(provider, true)
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

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProviderViewHolder {
        val binding = ItemServiceProviderBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ProviderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ProviderViewHolder, position: Int) {
        holder.bind(providers[position])
    }

    override fun getItemCount(): Int = providers.size
    
    /**
     * Atualiza a lista de prestadores
     */
    fun updateProviders(newProviders: List<ServiceProvider>) {
        providers = newProviders
        notifyDataSetChanged()
    }
}
