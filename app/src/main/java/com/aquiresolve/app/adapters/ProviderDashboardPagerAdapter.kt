package com.aquiresolve.app.adapters

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import androidx.viewpager2.adapter.FragmentStateAdapter
import com.aquiresolve.app.ProviderOrdersFragment
import com.aquiresolve.app.ProviderProfileFragment

/**
 * ProviderDashboardPagerAdapter - Adapter para as abas do dashboard do prestador
 */
class ProviderDashboardPagerAdapter(fragmentActivity: FragmentActivity) : FragmentStateAdapter(fragmentActivity) {

    override fun getItemCount(): Int = 2

    override fun createFragment(position: Int): Fragment {
        return when (position) {
            0 -> ProviderOrdersFragment()
            1 -> ProviderProfileFragment()
            else -> ProviderOrdersFragment()
        }
    }
}





