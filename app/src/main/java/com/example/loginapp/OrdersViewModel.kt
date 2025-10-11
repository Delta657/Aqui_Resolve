package com.example.loginapp

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import com.example.loginapp.models.OrderData

/**
 * ViewModel compartilhado para a tela de pedidos (Activity + Fragments)
 * Centraliza a lista de pedidos e notifica as abas quando houver mudanças.
 */
class OrdersViewModel : ViewModel() {
    private val _orders = MutableLiveData<List<OrderData>>(emptyList())
    val orders: LiveData<List<OrderData>> = _orders

    fun setOrders(newOrders: List<OrderData>) {
        _orders.value = newOrders
    }
}






