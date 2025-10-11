package com.example.loginapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Geocoder
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.loginapp.adapters.SavedAddressAdapter
import com.example.loginapp.databinding.ActivityAddressManagementBinding
import com.example.loginapp.models.SavedAddress
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MarkerOptions
import com.google.firebase.firestore.GeoPoint
import kotlinx.coroutines.launch
import java.util.*

/**
 * Activity para gerenciar endereços salvos do cliente
 */
class AddressManagementActivity : AppCompatActivity(), OnMapReadyCallback {
    
    private lateinit var binding: ActivityAddressManagementBinding
    private lateinit var addressAdapter: SavedAddressAdapter
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var googleMap: GoogleMap
    private var savedAddresses = mutableListOf<SavedAddress>()
    
    private val locationPermissionRequest = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        when {
            permissions.getOrDefault(Manifest.permission.ACCESS_FINE_LOCATION, false) -> {
                // Precise location access granted.
                getCurrentLocation()
            }
            permissions.getOrDefault(Manifest.permission.ACCESS_COARSE_LOCATION, false) -> {
                // Only approximate location access granted.
                getCurrentLocation()
            }
            else -> {
                // No location access granted.
                showToast("Permissão de localização necessária para usar esta funcionalidade")
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddressManagementBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // Verificar se Google Play Services está disponível
        if (!isGooglePlayServicesAvailable()) {
            showToast("Google Play Services não está disponível")
            finish()
            return
        }
        
        setupToolbar()
        setupRecyclerView()
        setupMapFragment()
        setupClickListeners()
        
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        
        loadSavedAddresses()
    }
    
    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Meus Endereços"
        
        binding.toolbar.setNavigationOnClickListener {
            finish()
        }
    }
    
    private fun setupRecyclerView() {
        addressAdapter = SavedAddressAdapter(
            addresses = savedAddresses,
            onAddressClick = { address ->
                showAddressDetails(address)
            },
            onEditClick = { address ->
                editAddress(address)
            },
            onDeleteClick = { address ->
                deleteAddress(address)
            },
            onSetDefaultClick = { address ->
                setDefaultAddress(address)
            }
        )
        
        binding.recyclerViewAddresses.apply {
            layoutManager = LinearLayoutManager(this@AddressManagementActivity)
            adapter = addressAdapter
        }
    }
    
    private fun setupMapFragment() {
        val mapFragment = supportFragmentManager
            .findFragmentById(R.id.mapFragment) as SupportMapFragment
        mapFragment.getMapAsync(this)
    }
    
    private fun setupClickListeners() {
        binding.fabAddAddress.setOnClickListener {
            showAddAddressDialog()
        }
        
        binding.btnCurrentLocation.setOnClickListener {
            requestLocationPermission()
        }
    }
    
    override fun onMapReady(map: GoogleMap) {
        googleMap = map
        
        // Configurar o mapa
        googleMap.uiSettings.isZoomControlsEnabled = true
        googleMap.uiSettings.isMyLocationButtonEnabled = false
        
        // Adicionar listener para cliques no mapa
        googleMap.setOnMapClickListener { latLng ->
            showAddAddressFromMapDialog(latLng)
        }
    }
    
    private fun requestLocationPermission() {
        when {
            ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED -> {
                getCurrentLocation()
            }
            else -> {
                locationPermissionRequest.launch(
                    arrayOf(
                        Manifest.permission.ACCESS_FINE_LOCATION,
                        Manifest.permission.ACCESS_COARSE_LOCATION
                    )
                )
            }
        }
    }
    
    private fun getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            return
        }
        
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            if (location != null) {
                val latLng = LatLng(location.latitude, location.longitude)
                googleMap.animateCamera(CameraUpdateFactory.newLatLngZoom(latLng, 15f))
                showAddAddressFromMapDialog(latLng)
            } else {
                showToast("Não foi possível obter sua localização atual")
            }
        }
    }
    
    private fun showAddAddressFromMapDialog(latLng: LatLng) {
        // Obter endereço a partir das coordenadas
        val geocoder = Geocoder(this, Locale.getDefault())
        
        try {
            val addresses = geocoder.getFromLocation(latLng.latitude, latLng.longitude, 1)
            if (addresses?.isNotEmpty() == true) {
                val address = addresses[0]
                val fullAddress = address.getAddressLine(0) ?: ""
                
                showAddAddressDialog(
                    address = fullAddress,
                    coordinates = GeoPoint(latLng.latitude, latLng.longitude)
                )
            } else {
                showToast("Não foi possível obter o endereço desta localização")
            }
        } catch (e: Exception) {
            showToast("Erro ao obter endereço: ${e.message}")
        }
    }
    
    /**
     * Configura o spinner de estados no diálogo
     */
    private fun setupStateSpinner(dialogBinding: com.example.loginapp.databinding.DialogAddAddressBinding) {
        val states = com.example.loginapp.utils.BrazilianStates.getFormattedStates()
        val adapter = android.widget.ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, states)
        dialogBinding.spinnerState.setAdapter(adapter)
        
        // Configurar para mostrar a lista ao clicar
        dialogBinding.spinnerState.setOnClickListener {
            dialogBinding.spinnerState.showDropDown()
        }
        
        // Listener para quando um estado for selecionado
        dialogBinding.spinnerState.setOnItemClickListener { _, _, position, _ ->
            val selectedState = states[position]
            android.util.Log.d("AddressManagement", "Estado selecionado: $selectedState")
        }
        
        // Configurar threshold para mostrar sugestões
        dialogBinding.spinnerState.threshold = 1
    }

    private fun showAddAddressDialog(address: String = "", coordinates: GeoPoint? = null) {
        val dialogBinding = com.example.loginapp.databinding.DialogAddAddressBinding.inflate(layoutInflater)
        
        // Configurar spinner de estados
        setupStateSpinner(dialogBinding)
        
        // Preencher campos se fornecidos
        if (address.isNotEmpty()) {
            dialogBinding.etAddress.setText(address)
        }
        
        val dialog = AlertDialog.Builder(this)
            .setTitle("Adicionar Endereço")
            .setView(dialogBinding.root)
            .setPositiveButton("Salvar") { _, _ ->
                val name = dialogBinding.etName.text.toString().trim()
                val fullAddress = dialogBinding.etAddress.text.toString().trim()
                val complement = dialogBinding.etComplement.text.toString().trim()
                val neighborhood = dialogBinding.etNeighborhood.text.toString().trim()
                val city = dialogBinding.etCity.text.toString().trim()
                val stateText = dialogBinding.spinnerState.text.toString().trim()
                val zipCode = dialogBinding.etZipCode.text.toString().trim()
                val isDefault = dialogBinding.cbDefault.isChecked
                
                if (name.isEmpty() || fullAddress.isEmpty()) {
                    showToast("Nome e endereço são obrigatórios")
                    return@setPositiveButton
                }
                
                // Extrair sigla do estado se necessário
                val state = if (stateText.contains(" - ")) {
                    stateText.substring(0, 2) // Extrair sigla do formato "SP - São Paulo"
                } else {
                    stateText
                }
                
                val newAddress = SavedAddress(
                    name = name,
                    address = fullAddress,
                    complement = complement,
                    neighborhood = neighborhood,
                    city = city,
                    state = state,
                    zipCode = zipCode,
                    coordinates = coordinates,
                    isDefault = isDefault
                )
                
                saveAddress(newAddress)
            }
            .setNegativeButton("Cancelar", null)
            .create()
        
        dialog.show()
    }
    
    private fun showAddressDetails(address: SavedAddress) {
        val message = buildString {
            append("Nome: ${address.name}\n")
            append("Endereço: ${address.getFullAddress()}\n")
            if (address.isDefault) {
                append("\n⭐ Endereço padrão")
            }
        }
        
        AlertDialog.Builder(this)
            .setTitle("Detalhes do Endereço")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }
    
    private fun editAddress(address: SavedAddress) {
        val dialogBinding = com.example.loginapp.databinding.DialogAddAddressBinding.inflate(layoutInflater)
        
        // Preencher campos com dados existentes
        dialogBinding.etName.setText(address.name)
        dialogBinding.etAddress.setText(address.address)
        dialogBinding.etComplement.setText(address.complement)
        dialogBinding.etNeighborhood.setText(address.neighborhood)
        dialogBinding.etCity.setText(address.city)
        dialogBinding.spinnerState.setText(address.state)
        dialogBinding.etZipCode.setText(address.zipCode)
        dialogBinding.cbDefault.isChecked = address.isDefault
        
        val dialog = AlertDialog.Builder(this)
            .setTitle("Editar Endereço")
            .setView(dialogBinding.root)
            .setPositiveButton("Salvar") { _, _ ->
                val name = dialogBinding.etName.text.toString().trim()
                val fullAddress = dialogBinding.etAddress.text.toString().trim()
                val complement = dialogBinding.etComplement.text.toString().trim()
                val neighborhood = dialogBinding.etNeighborhood.text.toString().trim()
                val city = dialogBinding.etCity.text.toString().trim()
                val state = dialogBinding.spinnerState.text.toString().trim()
                val zipCode = dialogBinding.etZipCode.text.toString().trim()
                val isDefault = dialogBinding.cbDefault.isChecked
                
                if (name.isEmpty() || fullAddress.isEmpty()) {
                    showToast("Nome e endereço são obrigatórios")
                    return@setPositiveButton
                }
                
                val updatedAddress = address.copy(
                    name = name,
                    address = fullAddress,
                    complement = complement,
                    neighborhood = neighborhood,
                    city = city,
                    state = state,
                    zipCode = zipCode,
                    isDefault = isDefault
                )
                
                updateAddress(updatedAddress)
            }
            .setNegativeButton("Cancelar", null)
            .create()
        
        dialog.show()
    }
    
    private fun deleteAddress(address: SavedAddress) {
        AlertDialog.Builder(this)
            .setTitle("Remover Endereço")
            .setMessage("Tem certeza que deseja remover o endereço \"${address.name}\"?")
            .setPositiveButton("Remover") { _, _ ->
                lifecycleScope.launch {
                    val result = FirebaseAddressManager().deleteAddress(address.id)
                    if (result.isSuccess) {
                        showToast("Endereço removido com sucesso")
                        loadSavedAddresses()
                    } else {
                        showToast("Erro ao remover endereço: ${result.exceptionOrNull()?.message}")
                    }
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    private fun setDefaultAddress(address: SavedAddress) {
        lifecycleScope.launch {
            val result = FirebaseAddressManager().setDefaultAddress(address.id)
            if (result.isSuccess) {
                showToast("Endereço definido como padrão")
                loadSavedAddresses()
            } else {
                showToast("Erro ao definir endereço padrão: ${result.exceptionOrNull()?.message}")
            }
        }
    }
    
    private fun saveAddress(address: SavedAddress) {
        lifecycleScope.launch {
            val result = FirebaseAddressManager().saveAddress(address)
            if (result.isSuccess) {
                showToast("Endereço salvo com sucesso")
                loadSavedAddresses()
            } else {
                showToast("Erro ao salvar endereço: ${result.exceptionOrNull()?.message}")
            }
        }
    }
    
    private fun updateAddress(address: SavedAddress) {
        lifecycleScope.launch {
            val result = FirebaseAddressManager().updateAddress(address)
            if (result.isSuccess) {
                showToast("Endereço atualizado com sucesso")
                loadSavedAddresses()
            } else {
                showToast("Erro ao atualizar endereço: ${result.exceptionOrNull()?.message}")
            }
        }
    }
    
    private fun loadSavedAddresses() {
        lifecycleScope.launch {
            binding.progressBar.visibility = View.VISIBLE
            
            val result = FirebaseAddressManager().getUserAddresses()
            if (result.isSuccess) {
                savedAddresses.clear()
                savedAddresses.addAll(result.getOrNull() ?: emptyList())
                addressAdapter.notifyDataSetChanged()
                
                // Atualizar marcadores no mapa
                updateMapMarkers()
                
                if (savedAddresses.isEmpty()) {
                    binding.layoutEmpty.visibility = View.VISIBLE
                    binding.recyclerViewAddresses.visibility = View.GONE
                } else {
                    binding.layoutEmpty.visibility = View.GONE
                    binding.recyclerViewAddresses.visibility = View.VISIBLE
                }
            } else {
                showToast("Erro ao carregar endereços: ${result.exceptionOrNull()?.message}")
            }
            
            binding.progressBar.visibility = View.GONE
        }
    }
    
    private fun updateMapMarkers() {
        if (::googleMap.isInitialized) {
            googleMap.clear()
            
            savedAddresses.forEach { address ->
                address.coordinates?.let { geoPoint ->
                    val latLng = LatLng(geoPoint.latitude, geoPoint.longitude)
                    val marker = googleMap.addMarker(
                        MarkerOptions()
                            .position(latLng)
                            .title(address.name)
                            .snippet(address.getShortAddress())
                    )
                }
            }
        }
    }
    
    private fun showToast(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show()
    }
    
    /**
     * Verifica se o Google Play Services está disponível
     */
    private fun isGooglePlayServicesAvailable(): Boolean {
        val googleApiAvailability = GoogleApiAvailability.getInstance()
        val resultCode = googleApiAvailability.isGooglePlayServicesAvailable(this)
        return resultCode == ConnectionResult.SUCCESS
    }
}

