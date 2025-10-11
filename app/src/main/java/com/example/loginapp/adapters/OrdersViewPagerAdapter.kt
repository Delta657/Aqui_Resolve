package com.example.loginapp.adapters

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.example.loginapp.OrdersTabFragment

/**
 * Adapter para o ViewPager2 das abas de pedidos
 */
class OrdersViewPagerAdapter(
    fragmentActivity: FragmentActivity,
    private val isProviderContext: Boolean = false
) : FragmentStateAdapter(fragmentActivity) {

    override fun getItemCount(): Int = if (isProviderContext) 3 else 4

    override fun createFragment(position: Int): Fragment {
        val fragment = if (isProviderContext) {
            // Prestador: 0 Disponíveis, 1 Aceitos, 2 Concluídos
            when (position) {
                0 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.DISTRIBUTING)
                1 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.IN_PROGRESS)
                2 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.COMPLETED)
                else -> throw IllegalArgumentException("Posição inválida: $position")
            }
        } else {
            // Cliente: 0 Em Andamento, 1 Em Distribuição, 2 Concluídos, 3 Cancelados
            when (position) {
                0 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.IN_PROGRESS)
                1 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.DISTRIBUTING)
                2 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.COMPLETED)
                3 -> OrdersTabFragment.newInstance(OrdersTabFragment.TabType.CANCELLED)
                else -> throw IllegalArgumentException("Posição inválida: $position")
            }
        }
        fragment.arguments?.putBoolean("is_provider_context", isProviderContext)
        return fragment
    }
}










