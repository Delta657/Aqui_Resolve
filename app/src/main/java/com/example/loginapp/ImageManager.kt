package com.example.loginapp

import android.content.ContentResolver
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream

/**
 * Gerenciador de imagens - Compressão, upload e gerenciamento
 * 
 * Funcionalidades:
 * - Compressão de imagens
 * - Obtenção de metadados
 * - Upload simulado
 * - Gerenciamento de cache
 */
object ImageManager {
    
    private const val TAG = "ImageManager"
    private const val MAX_IMAGE_SIZE = 1024 * 1024 // 1MB
    private const val COMPRESSION_QUALITY = 80
    private const val MAX_WIDTH = 1920
    private const val MAX_HEIGHT = 1080
    
    /**
     * Dados de uma imagem processada
     */
    data class ProcessedImage(
        val originalUri: Uri,
        val compressedUri: Uri?,
        val fileName: String,
        val originalSize: Long,
        val compressedSize: Long?,
        val width: Int,
        val height: Int,
        val mimeType: String,
        val isCompressed: Boolean = false
    )
    
    /**
     * Resultado do processamento
     */
    sealed class ProcessResult {
        data class Success(val processedImage: ProcessedImage) : ProcessResult()
        data class Error(val message: String) : ProcessResult()
    }
    
    /**
     * Processa uma imagem (obtém metadados e comprime se necessário)
     */
    suspend fun processImage(
        context: Context,
        uri: Uri,
        forceCompress: Boolean = false
    ): ProcessResult = withContext(Dispatchers.IO) {
        try {
            // Obter metadados da imagem
            val metadata = getImageMetadata(context, uri)
            if (metadata == null) {
                return@withContext ProcessResult.Error("Não foi possível ler a imagem")
            }
            
            // Verificar se precisa comprimir
            val needsCompression = forceCompress || metadata.size > MAX_IMAGE_SIZE
            
            if (needsCompression) {
                // Comprimir imagem
                val compressedUri = compressImage(context, uri, metadata)
                if (compressedUri != null) {
                    val compressedSize = getFileSize(context, compressedUri)
                    ProcessResult.Success(
                        ProcessedImage(
                            originalUri = uri,
                            compressedUri = compressedUri,
                            fileName = metadata.fileName,
                            originalSize = metadata.size,
                            compressedSize = compressedSize,
                            width = metadata.width,
                            height = metadata.height,
                            mimeType = metadata.mimeType,
                            isCompressed = true
                        )
                    )
                } else {
                    ProcessResult.Error("Falha na compressão da imagem")
                }
            } else {
                // Imagem não precisa ser comprimida
                ProcessResult.Success(
                    ProcessedImage(
                        originalUri = uri,
                        compressedUri = null,
                        fileName = metadata.fileName,
                        originalSize = metadata.size,
                        compressedSize = null,
                        width = metadata.width,
                        height = metadata.height,
                        mimeType = metadata.mimeType,
                        isCompressed = false
                    )
                )
            }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao processar imagem", e)
            ProcessResult.Error("Erro ao processar imagem: ${e.message}")
        }
    }
    
    /**
     * Obtém metadados de uma imagem
     */
    private suspend fun getImageMetadata(
        context: Context,
        uri: Uri
    ): ImageMetadata? = withContext(Dispatchers.IO) {
        try {
            val contentResolver = context.contentResolver
            
            // Obter nome do arquivo
            val fileName = getFileName(contentResolver, uri)
            
            // Obter tamanho do arquivo
            val fileSize = getFileSize(context, uri)
            
            // Obter dimensões da imagem
            val dimensions = getImageDimensions(contentResolver, uri)
            
            // Obter tipo MIME
            val mimeType = contentResolver.getType(uri) ?: "image/jpeg"
            
            ImageMetadata(
                fileName = fileName,
                size = fileSize,
                width = dimensions.first,
                height = dimensions.second,
                mimeType = mimeType
            )
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao obter metadados", e)
            null
        }
    }
    
    /**
     * Comprime uma imagem
     */
    private suspend fun compressImage(
        context: Context,
        uri: Uri,
        metadata: ImageMetadata
    ): Uri? = withContext(Dispatchers.IO) {
        try {
            // Carregar bitmap
            val bitmap = loadBitmap(context, uri)
            if (bitmap == null) return@withContext null
            
            // Redimensionar se necessário
            val resizedBitmap = resizeBitmap(bitmap)
            
            // Comprimir
            val compressedBytes = compressBitmap(resizedBitmap)
            
            // Salvar arquivo comprimido
            val compressedFile = saveCompressedImage(context, compressedBytes, metadata.fileName)
            
            // Limpar bitmaps
            bitmap.recycle()
            if (resizedBitmap != bitmap) {
                resizedBitmap.recycle()
            }
            
            compressedFile?.let { Uri.fromFile(it) }
            
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao comprimir imagem", e)
            null
        }
    }
    
    /**
     * Carrega um bitmap de uma URI
     */
    private fun loadBitmap(context: Context, uri: Uri): Bitmap? {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri)
            inputStream?.use { BitmapFactory.decodeStream(it) }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao carregar bitmap", e)
            null
        }
    }
    
    /**
     * Redimensiona um bitmap se necessário
     */
    private fun resizeBitmap(bitmap: Bitmap): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        
        // Verificar se precisa redimensionar
        if (width <= MAX_WIDTH && height <= MAX_HEIGHT) {
            return bitmap
        }
        
        // Calcular novas dimensões mantendo proporção
        val ratio = minOf(MAX_WIDTH.toFloat() / width, MAX_HEIGHT.toFloat() / height)
        val newWidth = (width * ratio).toInt()
        val newHeight = (height * ratio).toInt()
        
        return Bitmap.createScaledBitmap(bitmap, newWidth, newHeight, true)
    }
    
    /**
     * Comprime um bitmap para bytes
     */
    private fun compressBitmap(bitmap: Bitmap): ByteArray {
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, COMPRESSION_QUALITY, outputStream)
        return outputStream.toByteArray()
    }
    
    /**
     * Salva imagem comprimida em arquivo
     */
    private fun saveCompressedImage(
        context: Context,
        bytes: ByteArray,
        originalFileName: String
    ): File? {
        return try {
            val cacheDir = context.cacheDir
            val fileName = "compressed_${System.currentTimeMillis()}_$originalFileName"
            val file = File(cacheDir, fileName)
            
            FileOutputStream(file).use { fos ->
                fos.write(bytes)
            }
            
            file
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao salvar imagem comprimida", e)
            null
        }
    }
    
    /**
     * Obtém nome do arquivo de uma URI
     */
    private fun getFileName(contentResolver: ContentResolver, uri: Uri): String {
        return try {
            val cursor = contentResolver.query(uri, null, null, null, null)
            cursor?.use {
                if (it.moveToFirst()) {
                    val displayNameIndex = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (displayNameIndex != -1) {
                        it.getString(displayNameIndex)
                    } else {
                        "imagem_${System.currentTimeMillis()}.jpg"
                    }
                } else {
                    "imagem_${System.currentTimeMillis()}.jpg"
                }
            } ?: "imagem_${System.currentTimeMillis()}.jpg"
        } catch (e: Exception) {
            "imagem_${System.currentTimeMillis()}.jpg"
        }
    }
    
    /**
     * Obtém tamanho do arquivo
     */
    private fun getFileSize(context: Context, uri: Uri): Long {
        return try {
            val inputStream = context.contentResolver.openInputStream(uri)
            inputStream?.use { it.available().toLong() } ?: 0L
        } catch (e: Exception) {
            0L
        }
    }
    
    /**
     * Obtém dimensões da imagem
     */
    private fun getImageDimensions(contentResolver: ContentResolver, uri: Uri): Pair<Int, Int> {
        return try {
            val inputStream = contentResolver.openInputStream(uri)
            inputStream?.use { stream ->
                val options = BitmapFactory.Options().apply {
                    inJustDecodeBounds = true
                }
                BitmapFactory.decodeStream(stream, null, options)
                Pair(options.outWidth, options.outHeight)
            } ?: Pair(0, 0)
        } catch (e: Exception) {
            Pair(0, 0)
        }
    }
    
    /**
     * Simula upload de imagem
     */
    suspend fun uploadImage(
        context: Context,
        processedImage: ProcessedImage
    ): UploadResult = withContext(Dispatchers.IO) {
        try {
            // Simular delay de upload
            kotlinx.coroutines.delay(2000)
            
            // Simular sucesso ocasional
            val success = (System.currentTimeMillis() % 10) < 8 // 80% de sucesso
            
            if (success) {
                val uploadUrl = "https://storage.example.com/images/${System.currentTimeMillis()}.jpg"
                UploadResult.Success(uploadUrl)
            } else {
                UploadResult.Error("Falha no upload")
            }
            
        } catch (e: Exception) {
            UploadResult.Error("Erro no upload: ${e.message}")
        }
    }
    
    /**
     * Limpa cache de imagens comprimidas
     */
    fun clearCache(context: Context) {
        try {
            val cacheDir = context.cacheDir
            cacheDir.listFiles()?.forEach { file ->
                if (file.name.startsWith("compressed_")) {
                    file.delete()
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Erro ao limpar cache", e)
        }
    }
    
    /**
     * Dados de metadados da imagem
     */
    private data class ImageMetadata(
        val fileName: String,
        val size: Long,
        val width: Int,
        val height: Int,
        val mimeType: String
    )
    
    /**
     * Resultado do upload
     */
    sealed class UploadResult {
        data class Success(val url: String) : UploadResult()
        data class Error(val message: String) : UploadResult()
    }
} 