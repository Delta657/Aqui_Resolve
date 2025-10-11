package com.example.loginapp

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.loginapp.databinding.ActivityProviderDocumentUploadBinding
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.launch
import java.util.*

/**
 * ProviderDocumentUploadActivity - Tela para upload de documentos de prestadores
 */
class ProviderDocumentUploadActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityProviderDocumentUploadBinding
    private val auth = FirebaseAuth.getInstance()
    
    // Constantes para câmera e galeria
    companion object {
        private const val REQUEST_CAMERA = 1001
        private const val REQUEST_GALLERY = 1002
        private const val REQUEST_CAMERA_PERMISSION = 1003
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        binding = ActivityProviderDocumentUploadBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        setupUI()
        setupClickListeners()
    }
    
    /**
     * Configura a interface
     */
    private fun setupUI() {
        // Configurar título
        binding.tvTitle.text = "Documentos para Verificação"
        binding.tvSubtitle.text = "Envie os documentos obrigatórios para ativar sua conta de prestador"
        
        // Configurar lista de documentos
        setupDocumentList()
    }
    
    /**
     * Configura a lista de documentos obrigatórios
     */
    private fun setupDocumentList() {
        binding.tvDocumentList.text = buildString {
            appendLine("📋 Documentos Obrigatórios:")
            appendLine()
            appendLine("1. RG ou CNH (Frente) - ❌ Pendente")
            appendLine("2. RG ou CNH (Verso) - ❌ Pendente")
            appendLine("3. Comprovante de Residência - ❌ Pendente")
            appendLine("4. Selfie para Verificação - ❌ Pendente")
        }
    }
    
    /**
     * Configura os listeners
     */
    private fun setupClickListeners() {
        // Botão voltar
        binding.btnBack.setOnClickListener {
            finish()
        }
        
        // Botão enviar documentos
        binding.btnSubmitDocuments.setOnClickListener {
            submitDocuments()
        }
        
        // Botões de upload para cada documento
        binding.btnUploadRgFrente.setOnClickListener {
            showDocumentPicker("RG ou CNH (Frente)")
        }
        
        binding.btnUploadRgVerso.setOnClickListener {
            showDocumentPicker("RG ou CNH (Verso)")
        }
        
        binding.btnUploadComprovante.setOnClickListener {
            showDocumentPicker("Comprovante de Residência")
        }
        
        binding.btnUploadSelfie.setOnClickListener {
            showSelfiePicker()
        }
    }
    
    /**
     * Mostra seletor de documentos
     */
    private fun showDocumentPicker(documentType: String) {
        val options = arrayOf("📷 Tirar Foto", "🖼️ Galeria")
        
        AlertDialog.Builder(this)
            .setTitle("Enviar $documentType")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takePhoto(documentType)
                    1 -> selectFromGallery(documentType)
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    /**
     * Mostra seletor de selfie
     */
    private fun showSelfiePicker() {
        val options = arrayOf("📷 Tirar Selfie", "🖼️ Galeria")
        
        AlertDialog.Builder(this)
            .setTitle("Enviar Selfie")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takeSelfie()
                    1 -> selectFromGallery("Selfie para Verificação")
                }
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }
    
    /**
     * Tira foto do documento
     */
    private fun takePhoto(documentType: String) {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA_PERMISSION)
            return
        }
        
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (intent.resolveActivity(packageManager) != null) {
            startActivityForResult(intent, REQUEST_CAMERA)
        } else {
            showErrorMessage("Câmera não disponível")
        }
    }
    
    /**
     * Seleciona da galeria
     */
    private fun selectFromGallery(documentType: String) {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "image/*"
        startActivityForResult(Intent.createChooser(intent, "Selecionar $documentType"), REQUEST_GALLERY)
    }
    
    /**
     * Tira selfie
     */
    private fun takeSelfie() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.CAMERA), REQUEST_CAMERA_PERMISSION)
            return
        }
        
        val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
        if (intent.resolveActivity(packageManager) != null) {
            startActivityForResult(intent, REQUEST_CAMERA)
        } else {
            showErrorMessage("Câmera não disponível")
        }
    }
    
    /**
     * Processa resultado da câmera/galeria
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (resultCode == RESULT_OK) {
            when (requestCode) {
                REQUEST_CAMERA -> {
                    val imageUri = data?.data
                    if (imageUri != null) {
                        showSuccessMessage("Foto capturada com sucesso!")
                    }
                }
                REQUEST_GALLERY -> {
                    val imageUri = data?.data
                    if (imageUri != null) {
                        showSuccessMessage("Imagem selecionada com sucesso!")
                    }
                }
            }
        }
    }
    
    /**
     * Processa permissões
     */
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                showSuccessMessage("Permissão da câmera concedida")
            } else {
                showErrorMessage("Permissão da câmera negada")
            }
        }
    }
    
    /**
     * Envia documentos para aprovação
     */
    private fun submitDocuments() {
        lifecycleScope.launch {
            try {
                setLoadingState(true)
                
                val currentUser = auth.currentUser
                if (currentUser == null) {
                    showErrorMessage("Usuário não autenticado")
                    return@launch
                }
                
                // Simular envio de documentos
                kotlinx.coroutines.delay(2000)
                
                showSuccessMessage("✅ Documentos enviados para aprovação!")
                showSuccessMessage("⏳ Aguarde a análise da equipe administrativa")
                
                // Redirecionar para tela principal
                val intent = Intent(this@ProviderDocumentUploadActivity, ProviderHomeActivity::class.java)
                startActivity(intent)
                finish()
                
            } catch (e: Exception) {
                showErrorMessage("Erro ao enviar documentos: ${e.message}")
            } finally {
                setLoadingState(false)
            }
        }
    }
    
    /**
     * Controla estado de loading
     */
    private fun setLoadingState(loading: Boolean) {
        binding.progressBar.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnSubmitDocuments.isEnabled = !loading
    }
    
    /**
     * Mostra mensagem de sucesso
     */
    private fun showSuccessMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
    
    /**
     * Mostra mensagem de erro
     */
    private fun showErrorMessage(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
    }
}