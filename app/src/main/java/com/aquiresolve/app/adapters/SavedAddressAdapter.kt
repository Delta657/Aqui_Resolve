package com.aquiresolve.app.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.databinding.ItemSavedAddressBinding
import com.aquiresolve.app.models.SavedAddress

/**
 * Adapter para exibir endereços salvos do cliente
 */
class SavedAddressAdapter(
    private val addresses: List<SavedAddress>,
    private val onAddressClick: (SavedAddress) -> Unit,
    private val onEditClick: (SavedAddress) -> Unit,
    private val onDeleteClick: (SavedAddress) -> Unit,
    private val onSetDefaultClick: (SavedAddress) -> Unit
) : RecyclerView.Adapter<SavedAddressAdapter.AddressViewHolder>() {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AddressViewHolder {
        val binding = ItemSavedAddressBinding.inflate(
            LayoutInflater.from(parent.context),
            parent,
            false
        )
        return AddressViewHolder(binding)
    }
    
    override fun onBindViewHolder(holder: AddressViewHolder, position: Int) {
        holder.bind(addresses[position])
    }
    
    override fun getItemCount(): Int = addresses.size
    
    inner class AddressViewHolder(private val binding: ItemSavedAddressBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(address: SavedAddress) {
            // Nome do endereço
            binding.tvAddressName.text = address.name
            
            // Endereço completo
            binding.tvFullAddress.text = address.getFullAddress()
            
            // Indicador de endereço padrão
            if (address.isDefault) {
                binding.tvDefaultIndicator.visibility = View.VISIBLE
                binding.tvDefaultIndicator.text = "⭐ Padrão"
            } else {
                binding.tvDefaultIndicator.visibility = View.GONE
            }
            
            // Botão de editar
            binding.btnEdit.setOnClickListener {
                onEditClick(address)
            }
            
            // Botão de remover
            binding.btnDelete.setOnClickListener {
                onDeleteClick(address)
            }
            
            // Botão de definir como padrão (só aparece se não for padrão)
            if (address.isDefault) {
                binding.btnSetDefault.visibility = View.GONE
            } else {
                binding.btnSetDefault.visibility = View.VISIBLE
                binding.btnSetDefault.setOnClickListener {
                    onSetDefaultClick(address)
                }
            }
            
            // Clique no item principal
            binding.root.setOnClickListener {
                onAddressClick(address)
            }
        }
    }
}


