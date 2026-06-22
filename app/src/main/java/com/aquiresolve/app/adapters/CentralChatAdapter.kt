package com.aquiresolve.app.adapters

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.aquiresolve.app.R
import com.aquiresolve.app.models.CentralChatMessage
import java.text.SimpleDateFormat
import java.util.Locale

/**
 * Adapter para o chat Base ↔ Cliente (Central AquiResolve).
 * 2 view types: mensagem do admin (esquerda) e mensagem do cliente (direita).
 */
class CentralChatAdapter : RecyclerView.Adapter<RecyclerView.ViewHolder>() {

    private val items = mutableListOf<CentralChatMessage>()
    private val timeFmt = SimpleDateFormat("dd/MM HH:mm", Locale("pt", "BR"))

    companion object {
        private const val VIEW_TYPE_ADMIN = 0
        private const val VIEW_TYPE_CLIENT = 1
    }

    fun submit(list: List<CentralChatMessage>) {
        items.clear()
        items.addAll(list)
        notifyDataSetChanged()
    }

    override fun getItemCount(): Int = items.size

    override fun getItemViewType(position: Int): Int =
        if (items[position].isFromAdmin) VIEW_TYPE_ADMIN else VIEW_TYPE_CLIENT

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RecyclerView.ViewHolder {
        val inflater = LayoutInflater.from(parent.context)
        return if (viewType == VIEW_TYPE_ADMIN) {
            AdminVH(inflater.inflate(R.layout.item_central_msg_admin, parent, false))
        } else {
            ClientVH(inflater.inflate(R.layout.item_central_msg_client, parent, false))
        }
    }

    override fun onBindViewHolder(holder: RecyclerView.ViewHolder, position: Int) {
        val msg = items[position]
        when (holder) {
            is AdminVH -> holder.bind(msg)
            is ClientVH -> holder.bind(msg)
        }
    }

    private fun fmtTime(msg: CentralChatMessage): String {
        val ts = msg.createdAt ?: return ""
        return timeFmt.format(ts.toDate())
    }

    inner class AdminVH(view: View) : RecyclerView.ViewHolder(view) {
        private val tvTypeTag: TextView = view.findViewById(R.id.tvTypeTag)
        private val tvText: TextView = view.findViewById(R.id.tvText)
        private val tvTime: TextView = view.findViewById(R.id.tvTime)

        fun bind(msg: CentralChatMessage) {
            val typeLabel = when (msg.type) {
                CentralChatMessage.TYPE_PROMOTION -> "Promoção"
                CentralChatMessage.TYPE_NOTICE -> "Aviso"
                CentralChatMessage.TYPE_ORDER_UPDATE -> "Pedido"
                else -> ""
            }
            if (typeLabel.isNotBlank()) {
                tvTypeTag.text = typeLabel
                tvTypeTag.visibility = View.VISIBLE
            } else {
                tvTypeTag.visibility = View.GONE
            }
            tvText.text = msg.text
            tvTime.text = fmtTime(msg)
        }
    }

    inner class ClientVH(view: View) : RecyclerView.ViewHolder(view) {
        private val tvText: TextView = view.findViewById(R.id.tvText)
        private val tvTime: TextView = view.findViewById(R.id.tvTime)

        fun bind(msg: CentralChatMessage) {
            tvText.text = msg.text
            tvTime.text = fmtTime(msg)
        }
    }
}
