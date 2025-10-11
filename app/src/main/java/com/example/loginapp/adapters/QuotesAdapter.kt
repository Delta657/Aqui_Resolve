package com.example.loginapp.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.loginapp.R
import com.example.loginapp.models.QuoteData

/**
 * Adapter para lista de cotações
 */
class QuotesAdapter(
    private val quotes: List<QuoteData>,
    private val onQuoteClick: (QuoteData) -> Unit,
    private val onViewProfileClick: (QuoteData) -> Unit,
    private val onAcceptClick: (QuoteData) -> Unit
) : RecyclerView.Adapter<QuotesAdapter.QuoteViewHolder>() {

    class QuoteViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val ivProviderAvatar: ImageView = itemView.findViewById(R.id.ivProviderAvatar)
        val tvProviderName: TextView = itemView.findViewById(R.id.tvProviderName)
        val tvProviderRating: TextView = itemView.findViewById(R.id.tvProviderRating)
        val tvPrice: TextView = itemView.findViewById(R.id.tvPrice)
        val tvPriceLabel: TextView = itemView.findViewById(R.id.tvPriceLabel)
        val tvQuoteDescription: TextView = itemView.findViewById(R.id.tvQuoteDescription)
        val tvEstimatedTime: TextView = itemView.findViewById(R.id.tvEstimatedTime)
        val tvAvailableDate: TextView = itemView.findViewById(R.id.tvAvailableDate)
        val tvDistance: TextView = itemView.findViewById(R.id.tvDistance)
        val tvWarranty: TextView = itemView.findViewById(R.id.tvWarranty)
        val tvMaterial: TextView = itemView.findViewById(R.id.tvMaterial)
        val btnViewProfile: TextView = itemView.findViewById(R.id.btnViewProfile)
        val btnAccept: TextView = itemView.findViewById(R.id.btnAccept)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): QuoteViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_quote, parent, false)
        return QuoteViewHolder(view)
    }

    override fun onBindViewHolder(holder: QuoteViewHolder, position: Int) {
        val quote = quotes[position]
        
        // Configurar dados do prestador
        holder.tvProviderName.text = quote.providerName
        holder.tvProviderRating.text = "⭐ ${quote.providerRating} (${quote.providerReviews} avaliações)"
        
        // Configurar preço
        holder.tvPrice.text = "R$ %.2f".format(quote.price).replace(".", ",")
        holder.tvPriceLabel.text = "Preço Total"
        
        // Configurar descrição
        holder.tvQuoteDescription.text = quote.description
        
        // Configurar informações adicionais
        holder.tvEstimatedTime.text = quote.estimatedTime
        holder.tvAvailableDate.text = quote.availableDate
        holder.tvDistance.text = quote.distance
        
        // Configurar badges
        setBadges(holder, quote)
        
        // Configurar click listeners
        holder.itemView.setOnClickListener { onQuoteClick(quote) }
        holder.btnViewProfile.setOnClickListener { onViewProfileClick(quote) }
        holder.btnAccept.setOnClickListener { onAcceptClick(quote) }
    }

    override fun getItemCount(): Int = quotes.size

    /**
     * Define os badges baseado nas informações da cotação
     */
    private fun setBadges(holder: QuoteViewHolder, quote: QuoteData) {
        // Badge de garantia
        if (quote.warranty.isNotEmpty()) {
            holder.tvWarranty.text = "🛡️ ${quote.warranty}"
            holder.tvWarranty.visibility = View.VISIBLE
        } else {
            holder.tvWarranty.visibility = View.GONE
        }
        
        // Badge de material
        if (quote.includesMaterial) {
            holder.tvMaterial.text = "🔧 Inclui Material"
            holder.tvMaterial.visibility = View.VISIBLE
        } else {
            holder.tvMaterial.visibility = View.GONE
        }
    }
} 