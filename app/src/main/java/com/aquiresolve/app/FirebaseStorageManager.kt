package com.aquiresolve.app

import android.content.Context
import android.net.Uri
import com.google.firebase.storage.FirebaseStorage
import com.google.firebase.storage.StorageReference
import kotlinx.coroutines.tasks.await
import java.io.File
import java.util.UUID

class FirebaseStorageManager {
    
    private val storage: FirebaseStorage = FirebaseConfig.getStorage()
    
    suspend fun uploadImage(context: Context, imageUri: Uri, folder: String = "images"): Result<String> {
        return try {
            val fileName = "${UUID.randomUUID()}.jpg"
            val storageRef = storage.reference.child("$folder/$fileName")
            
            val uploadTask = storageRef.putFile(imageUri).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()
            
            Result.success(downloadUrl.toString())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadDocument(context: Context, documentUri: Uri, folder: String = "documents"): Result<String> {
        return try {
            val fileName = "${UUID.randomUUID()}.pdf"
            val storageRef = storage.reference.child("$folder/$fileName")
            
            val uploadTask = storageRef.putFile(documentUri).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()
            
            Result.success(downloadUrl.toString())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadMultipleImages(context: Context, imageUris: List<Uri>, folder: String = "images"): Result<List<String>> {
        return try {
            val downloadUrls = mutableListOf<String>()
            
            for (imageUri in imageUris) {
                val result = uploadImage(context, imageUri, folder)
                if (result.isSuccess) {
                    downloadUrls.add(result.getOrNull()!!)
                } else {
                    return Result.failure(result.exceptionOrNull() ?: Exception("Failed to upload image"))
                }
            }
            
            Result.success(downloadUrls)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadMultipleDocuments(context: Context, documentUris: List<Uri>, folder: String = "documents"): Result<List<String>> {
        return try {
            val downloadUrls = mutableListOf<String>()
            
            for (documentUri in documentUris) {
                val result = uploadDocument(context, documentUri, folder)
                if (result.isSuccess) {
                    downloadUrls.add(result.getOrNull()!!)
                } else {
                    return Result.failure(result.exceptionOrNull() ?: Exception("Failed to upload document"))
                }
            }
            
            Result.success(downloadUrls)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteFile(fileUrl: String): Result<Unit> {
        return try {
            val storageRef = storage.getReferenceFromUrl(fileUrl)
            storageRef.delete().await()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun deleteMultipleFiles(fileUrls: List<String>): Result<Unit> {
        return try {
            for (fileUrl in fileUrls) {
                deleteFile(fileUrl)
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    fun getDownloadUrl(fileUrl: String): String {
        return fileUrl
    }
    
    suspend fun uploadProfileImage(context: Context, imageUri: Uri, userId: String): Result<String> {
        return try {
            val fileName = "profile_${userId}.jpg"
            val storageRef = storage.reference.child("profiles/$fileName")
            
            val uploadTask = storageRef.putFile(imageUri).await()
            val downloadUrl = uploadTask.storage.downloadUrl.await()
            
            Result.success(downloadUrl.toString())
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadOrderImages(context: Context, imageUris: List<Uri>, orderId: String): Result<List<String>> {
        return try {
            val downloadUrls = mutableListOf<String>()
            
            for ((index, imageUri) in imageUris.withIndex()) {
                val fileName = "order_${orderId}_${index}.jpg"
                val storageRef = storage.reference.child("orders/$orderId/images/$fileName")
                
                val uploadTask = storageRef.putFile(imageUri).await()
                val downloadUrl = uploadTask.storage.downloadUrl.await()
                downloadUrls.add(downloadUrl.toString())
            }
            
            Result.success(downloadUrls)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
    
    suspend fun uploadOrderDocuments(context: Context, documentUris: List<Uri>, orderId: String): Result<List<String>> {
        return try {
            val downloadUrls = mutableListOf<String>()
            
            for ((index, documentUri) in documentUris.withIndex()) {
                val fileName = "order_${orderId}_doc_${index}.pdf"
                val storageRef = storage.reference.child("orders/$orderId/documents/$fileName")
                
                val uploadTask = storageRef.putFile(documentUri).await()
                val downloadUrl = uploadTask.storage.downloadUrl.await()
                downloadUrls.add(downloadUrl.toString())
            }
            
            Result.success(downloadUrls)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
} 