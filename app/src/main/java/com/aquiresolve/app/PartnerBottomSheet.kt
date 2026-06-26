package com.aquiresolve.app

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Toast
import com.aquiresolve.app.databinding.BottomSheetPartnerBinding
import com.aquiresolve.app.models.Partner
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.google.android.material.bottomsheet.BottomSheetDialogFragment

/**
 * Bottom sheet de detalhe do parceiro.
 *
 * Exibe banner, nome, benefício, descrição, cupom copiável e botões de contato
 * (WhatsApp, Instagram, Site) — cada um aparece apenas se o campo estiver preenchido
 * no painel admin. Substitui a PartnerDetailActivity (tela cheia) por um card deslizante.
 */
class PartnerBottomSheet : BottomSheetDialogFragment() {

    private var _binding: BottomSheetPartnerBinding? = null
    private val binding get() = _binding!!

    companion object {
        const val TAG = "PartnerBottomSheet"
        private const val ARG_PARTNER_ID = "partner_id"

        fun newInstance(partnerId: String): PartnerBottomSheet {
            return PartnerBottomSheet().apply {
                arguments = Bundle().apply { putString(ARG_PARTNER_ID, partnerId) }
            }
        }
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        _binding = BottomSheetPartnerBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        val partnerId = arguments?.getString(ARG_PARTNER_ID).orEmpty()
        val partner = PartnerRepository.cachedPartnerById(partnerId)
        if (partner == null) {
            Toast.makeText(requireContext(), "Parceiro indisponível", Toast.LENGTH_SHORT).show()
            dismissAllowingStateLoss()
            return
        }
        bind(partner)
    }

    private fun bind(partner: Partner) {
        // Banner / logo
        val image = partner.bannerUrl.ifBlank { partner.logoUrl }
        if (image.isNotBlank()) {
            Glide.with(this)
                .load(image)
                .diskCacheStrategy(DiskCacheStrategy.ALL)
                .centerCrop()
                .into(binding.ivBanner)
        } else {
            binding.ivBanner.visibility = View.GONE
        }

        binding.tvName.text = partner.name

        // Badge de benefício
        if (partner.benefitLabel.isNotBlank()) {
            binding.tvBenefit.text = partner.benefitLabel
            binding.tvBenefit.visibility = View.VISIBLE
        }

        // Descrição
        if (partner.description.isNotBlank()) {
            binding.tvDescription.text = partner.description
            binding.tvDescription.visibility = View.VISIBLE
        }

        // Aviso para benefício concedido pelo parceiro (não pelo app)
        val explanation = benefitExplanation(partner.benefitType)
        if (explanation != null) {
            binding.tvBenefitExplanation.text = explanation
            binding.tvBenefitExplanation.visibility = View.VISIBLE
        }

        // Cupom
        if (partner.hasCoupon()) {
            binding.sectionCoupon.visibility = View.VISIBLE
            binding.tvCouponCode.text = partner.couponCode
            binding.btnCopyCoupon.setOnClickListener { copyCoupon(partner) }
        }

        // Seção de contato — aparece apenas se houver ao menos um canal preenchido
        val hasContact = partner.hasWhatsapp() || partner.hasInstagram() || partner.hasUrl()
        if (hasContact) {
            binding.dividerContact.visibility = View.VISIBLE
            binding.tvContactTitle.visibility = View.VISIBLE
        }

        if (partner.hasWhatsapp()) {
            binding.btnWhatsapp.visibility = View.VISIBLE
            binding.btnWhatsapp.setOnClickListener { openWhatsapp(partner) }
        }

        if (partner.hasInstagram()) {
            binding.btnInstagram.visibility = View.VISIBLE
            binding.btnInstagram.setOnClickListener { openInstagram(partner) }
        }

        if (partner.hasUrl()) {
            binding.btnSite.visibility = View.VISIBLE
            binding.btnSite.setOnClickListener { openSite(partner) }
        }
    }

    private fun openWhatsapp(partner: Partner) {
        try {
            val raw = partner.whatsapp.trim()
            val url = if (raw.startsWith("http://", true) || raw.startsWith("https://", true)) {
                raw
            } else {
                val digits = raw.filter { it.isDigit() }
                val phone = if (digits.length <= 11) "55$digits" else digits
                val text = Uri.encode("Olá! Vim pelo AquiResolve e quero saber mais sobre os benefícios.")
                "https://wa.me/$phone?text=$text"
            }
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            log("parceiro_whatsapp_aberto", partner)
        } catch (_: Exception) {
            toast("Não foi possível abrir o WhatsApp")
        }
    }

    private fun openInstagram(partner: Partner) {
        try {
            val raw = partner.instagram.trim()
            val url = when {
                raw.startsWith("http://", true) || raw.startsWith("https://", true) -> raw
                else -> "https://instagram.com/${raw.removePrefix("@")}"
            }
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            log("parceiro_instagram_aberto", partner)
        } catch (_: Exception) {
            toast("Não foi possível abrir o Instagram")
        }
    }

    private fun openSite(partner: Partner) {
        try {
            var url = partner.url.trim()
            if (!url.startsWith("http://", true) && !url.startsWith("https://", true)) {
                url = "https://$url"
            }
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
            log("parceiro_link_aberto", partner)
        } catch (_: Exception) {
            toast("Não foi possível abrir o site")
        }
    }

    private fun copyCoupon(partner: Partner) {
        try {
            val clipboard = requireContext().getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
            clipboard.setPrimaryClip(ClipData.newPlainText("Cupom ${partner.name}", partner.couponCode))
            toast("Cupom copiado: ${partner.couponCode}")
            log("parceiro_cupom_copiado", partner)
        } catch (_: Exception) {
            toast("Não foi possível copiar o cupom")
        }
    }

    private fun benefitExplanation(benefitType: String): String? = when {
        benefitType.equals(Partner.TYPE_DISCOUNT, ignoreCase = true) ->
            "ℹ️  Este desconto é concedido diretamente pelo parceiro. Para aproveitá-lo, apresente-se como cliente AquiResolve ao contratar ou acesse o site do parceiro."
        benefitType.equals(Partner.TYPE_CASHBACK, ignoreCase = true) ->
            "ℹ️  Este cashback é concedido diretamente pelo parceiro. Para aproveitá-lo, apresente-se como cliente AquiResolve ao contratar ou acesse o site do parceiro."
        else -> null
    }

    private fun log(event: String, partner: Partner) {
        try {
            FirebaseConfig.getAnalytics()?.logEvent(event, Bundle().apply {
                putString("partnerId", partner.id)
                putString("partnerName", partner.name)
            })
        } catch (_: Exception) {}
    }

    private fun toast(msg: String) {
        Toast.makeText(requireContext(), msg, Toast.LENGTH_SHORT).show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
