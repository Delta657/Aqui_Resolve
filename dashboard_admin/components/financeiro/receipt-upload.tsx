'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Upload, FileText, Image, X, CheckCircle2, AlertCircle,
  Loader2, Download, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { adminFetch } from '@/lib/admin-api'

interface ReceiptData {
  fileName: string
  storagePath: string
  downloadUrl: string
  contentType: string
  size: number
  uploadedAt: string
}

interface ReceiptUploadProps {
  paymentId: string
  onUploadComplete?: (receipt: ReceiptData) => void
  className?: string
}

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp']

export function ReceiptUpload({ paymentId, onUploadComplete, className }: ReceiptUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState<ReceiptData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isPdf = file?.type === 'application/pdf'
  const isImage = file?.type?.startsWith('image/')

  const validateFile = useCallback((f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Formato não suportado. Use: PDF, PNG, JPEG ou WebP`
    }
    if (f.size > MAX_SIZE) {
      return `Arquivo muito grande. Máximo: ${(MAX_SIZE / 1024 / 1024).toFixed(0)} MB`
    }
    return null
  }, [])

  const handleFile = useCallback((f: File) => {
    setError(null)
    const validationError = validateFile(f)
    if (validationError) {
      setError(validationError)
      return
    }

    setFile(f)

    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(f)
    } else {
      setPreview(null)
    }
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [handleFile])

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await adminFetch(
        `/api/financial/providers/payment/${paymentId}/receipt`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        const json = await response.json()
        throw new Error(json.error || `Erro HTTP ${response.status}`)
      }

      const json = await response.json()
      if (json.success) {
        setUploaded(json.data)
        onUploadComplete?.(json.data)
      } else {
        throw new Error(json.error || 'Erro ao fazer upload')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setPreview(null)
    setUploaded(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Uploaded state
  if (uploaded) {
    return (
      <div className={cn('rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 text-center', className)}>
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
          Comprovante anexado
        </p>
        <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3 truncate">
          {uploaded.fileName}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(uploaded.downloadUrl, '_blank')}
            className="text-xs"
          >
            <Eye className="h-3.5 w-3.5 mr-1" />
            Visualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs">
            <X className="h-3.5 w-3.5 mr-1" />
            Remover
          </Button>
        </div>
      </div>
    )
  }

  // File selected but not uploaded yet
  if (file) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Preview card */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            {isImage && preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg border border-border"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                {isPdf ? (
                  <FileText className="h-8 w-8 text-red-500" />
                ) : (
                  <Image className="h-8 w-8 text-blue-500" />
                )}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatSize(file.size)} • {file.type || 'desconhecido'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5 mr-1" />
                      Enviar Comprovante
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-xs h-8"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            {error}
          </div>
        )}
      </div>
    )
  }

  // Drop zone
  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
          className="hidden"
        />
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground mb-1">
          Arraste ou clique para anexar
        </p>
        <p className="text-xs text-muted-foreground">
          PDF, PNG, JPEG ou WebP • Máximo {MAX_SIZE / 1024 / 1024} MB
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
