import {
  ref,
  getDownloadURL,
  listAll,
  getMetadata,
  type FirebaseStorage,
  type StorageReference,
} from 'firebase/storage';
import * as firebaseModule from './firebase';
const storageInstance = firebaseModule.storage as FirebaseStorage | null;
import { StorageDocument, ProviderDocuments } from '@/types/verification';

/** Profundidade máxima ao listar subpastas (ex.: Documentos/uid/cnh/arquivo.jpg). */
const MAX_STORAGE_RECURSION_DEPTH = 3;

const PROVIDER_DOCUMENT_BASE_PATHS = (providerId: string): string[] => [
  `Documentos/${providerId}`,
  `documentos/${providerId}`,
  `Providers/${providerId}`,
  `providers/${providerId}`,
  `documentos_usuario/${providerId}`,
];

async function listAllFilesRecursive(dirRef: StorageReference, depth: number): Promise<StorageReference[]> {
  if (depth <= 0) return [];
  try {
    const res = await listAll(dirRef);
    const files: StorageReference[] = [...res.items];
    for (const sub of res.prefixes) {
      files.push(...(await listAllFilesRecursive(sub, depth - 1)));
    }
    return files;
  } catch {
    return [];
  }
}

/**
 * Todos os arquivos do prestador em possíveis raízes do bucket (app móvel pode usar subpastas).
 */
async function collectProviderFileRefs(providerId: string): Promise<StorageReference[]> {
  if (!storageInstance) return [];
  const seen = new Set<string>();
  const out: StorageReference[] = [];
  for (const base of PROVIDER_DOCUMENT_BASE_PATHS(providerId)) {
    const dirRef = ref(storageInstance, base);
    const files = await listAllFilesRecursive(dirRef, MAX_STORAGE_RECURSION_DEPTH);
    for (const f of files) {
      if (!seen.has(f.fullPath)) {
        seen.add(f.fullPath);
        out.push(f);
      }
    }
    // Achou arquivos nesta path — não precisa varrer as outras
    if (out.length > 0) break;
  }
  return out;
}

// Processar em lotes para limitar concorrência
const runInBatches = async <T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    batchResults.forEach(r => {
      if (r.status === 'fulfilled' && r.value != null) results.push(r.value);
    });
  }
  return results;
};

// Helper para obter URL de download com retry e tratamento de erro robusto
const getDownloadURLWithRetry = async (
  itemRef: ReturnType<typeof ref>,
  retries = 3
): Promise<string | null> => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await getDownloadURL(itemRef);
    } catch (error: any) {
      const errorCode = error?.code || error?.message || '';
      if (errorCode.includes('storage/object-not-found') || 
          errorCode.includes('storage/unauthorized') ||
          errorCode.includes('storage/permission-denied')) {
        return null;
      }
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
};

/** Exportado para o visualizador resolver URL em tempo de exibição (fallback). */
export async function resolveStorageDownloadUrl(fullPath: string): Promise<string | null> {
  if (!storageInstance || !fullPath) return null;
  try {
    const r = ref(storageInstance, fullPath);
    return await getDownloadURLWithRetry(r, 3);
  } catch {
    return null;
  }
}

// Inferir tipo de documento pelo nome do arquivo ou caminho completo (inclui pastas)
const inferDocType = (fileNameOrPath: string): 'cpf' | 'cnh' | 'comprovante_residencia' | 'certificado' | 'outros' => {
  const lower = fileNameOrPath.toLowerCase();
  if (lower.includes('cpf') || lower.includes('rg') || lower.includes('identidade')) return 'cpf';
  if (lower.includes('cnh') || lower.includes('habilitacao') || lower.includes('carteira')) return 'cnh';
  if (lower.includes('residencia') || lower.includes('endereco') || lower.includes('comprovante') || lower.includes('conta')) return 'comprovante_residencia';
  if (lower.includes('certificado') || lower.includes('curso') || lower.includes('diploma') || lower.includes('formacao')) return 'certificado';
  return 'outros';
};

/** Converte uma lista de StorageReferences em ProviderDocuments (sem URLs). */
async function buildProviderDocumentsFromRefs(
  providerId: string,
  itemRefs: StorageReference[]
): Promise<ProviderDocuments | null> {
  if (itemRefs.length === 0) return null;
  const documents: ProviderDocuments = {
    providerId,
    documents: {},
    uploadedAt: new Date(),
    firstUploadedAt: new Date(),
    status: 'pending',
  };
  const processed = await runInBatches(itemRefs, 8, async (itemRef) => {
    const metadata = await getMetadata(itemRef).catch(() => null);
    const ext = (itemRef.name.split('.').pop() || '').toLowerCase();
    const docType = inferDocType(itemRef.fullPath);
    const uploadedAt = metadata?.timeCreated ? new Date(metadata.timeCreated) : new Date();
    return {
      docType,
      document: {
        id: itemRef.fullPath.replace(/\//g, '__'),
        name: metadata?.name || itemRef.name,
        url: '',
        type: ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'document',
        size: metadata?.size || 0,
        uploadedAt,
        path: itemRef.fullPath,
      } as StorageDocument,
    } as const;
  });
  let minDate: Date | null = null;
  let maxDate: Date | null = null;
  processed.forEach(({ docType, document }) => {
    if (!documents.documents[docType]) documents.documents[docType] = [];
    documents.documents[docType]!.push(document);
    if (!minDate || document.uploadedAt < minDate) minDate = document.uploadedAt;
    if (!maxDate || document.uploadedAt > maxDate) maxDate = document.uploadedAt;
  });
  if (minDate) documents.firstUploadedAt = minDate;
  if (maxDate) documents.uploadedAt = maxDate;
  return documents;
}

// Versão leve: sem downloadURL, mas com metadata para preservar horário real de envio.
export const getProviderDocumentsLightweight = async (providerId: string): Promise<ProviderDocuments | null> => {
  if (!storageInstance) return null;
  try {
    const itemRefs = await collectProviderFileRefs(providerId);
    return buildProviderDocumentsFromRefs(providerId, itemRefs);
  } catch {
    return null;
  }
};

/**
 * Versão otimizada para getAllPendingProviders: recebe a referência já conhecida,
 * evita re-varrer as 5 paths possíveis.
 */
async function getProviderDocumentsLightweightFromRef(
  dirRef: StorageReference
): Promise<ProviderDocuments | null> {
  if (!storageInstance) return null;
  try {
    const itemRefs = await listAllFilesRecursive(dirRef, MAX_STORAGE_RECURSION_DEPTH);
    return buildProviderDocumentsFromRefs(dirRef.name, itemRefs);
  } catch {
    return null;
  }
}

// Buscar documentos completos (com URLs) - usado quando o usuário abre "Ver Documentos"
export const getProviderDocuments = async (providerId: string): Promise<ProviderDocuments | null> => {
  if (!storageInstance) return null;
  try {
    const itemRefs = await collectProviderFileRefs(providerId);
    if (itemRefs.length === 0) return null;

    const documents: ProviderDocuments = {
      providerId,
      documents: {},
      uploadedAt: new Date(),
      firstUploadedAt: new Date(),
      status: 'pending'
    };

    const processed = await runInBatches(itemRefs, 4, async (itemRef) => {
      try {
        const metadata = await getMetadata(itemRef).catch(() => null);
        const downloadURL = await getDownloadURLWithRetry(itemRef);

        const fileName = itemRef.name.toLowerCase();
        const ext = fileName.split('.').pop() || '';
        const docType = inferDocType(itemRef.fullPath);

        const document: StorageDocument = {
          id: itemRef.fullPath.replace(/\//g, '__'),
          name: metadata?.name || itemRef.name,
          url: downloadURL || '',
          type: ext && ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : ext === 'pdf' ? 'pdf' : 'document',
          size: metadata?.size || 0,
          uploadedAt: metadata?.timeCreated ? new Date(metadata.timeCreated) : new Date(),
          path: itemRef.fullPath
        };
        return { docType, document } as const;
      } catch {
        return null;
      }
    });

    let minDate: Date | null = null;
    let maxDate: Date | null = null;
    processed.forEach((item) => {
      if (!item) return;
      const { docType, document } = item;
      if (!documents.documents[docType]) documents.documents[docType] = [];
      documents.documents[docType]!.push(document);
      if (!minDate || document.uploadedAt < minDate) minDate = document.uploadedAt;
      if (!maxDate || document.uploadedAt > maxDate) maxDate = document.uploadedAt;
    });

    if (Object.keys(documents.documents).length === 0) return null;
    if (minDate) documents.firstUploadedAt = minDate;
    if (maxDate) documents.uploadedAt = maxDate;
    return documents;
  } catch {
    return null;
  }
};

// Cache em memória com TTL de 3 minutos
let _pendingProvidersCache: { data: ProviderDocuments[]; ts: number } | null = null;
const CACHE_TTL_MS = 3 * 60 * 1000;

export const invalidatePendingProvidersCache = () => { _pendingProvidersCache = null; };

// Buscar todos os prestadores com documentos pendentes (versão otimizada - só listAll, sem URLs)
export const getAllPendingProviders = async (): Promise<ProviderDocuments[]> => {
  try {
    if (!storageInstance) return [];

    // Retorna cache se ainda válido
    if (_pendingProvidersCache && Date.now() - _pendingProvidersCache.ts < CACHE_TTL_MS) {
      return _pendingProvidersCache.data;
    }

    const folderRef = ref(storageInstance, 'Documentos');
    const result = await listAll(folderRef);
    if (result.prefixes.length === 0) return [];

    // Usa ref já conhecida — evita re-varrer as 5 paths por prestador
    const providers = await runInBatches(result.prefixes, 10, getProviderDocumentsLightweightFromRef);
    const filtered = providers.filter((p): p is ProviderDocuments => p !== null);

    _pendingProvidersCache = { data: filtered, ts: Date.now() };
    return filtered;
  } catch {
    return [];
  }
};

// Determinar o tipo de arquivo baseado na extensão
const getFileType = (extension: string): 'image' | 'pdf' | 'document' => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  const pdfExtensions = ['pdf'];
  
  if (imageExtensions.includes(extension.toLowerCase())) {
    return 'image';
  } else if (pdfExtensions.includes(extension.toLowerCase())) {
    return 'pdf';
  } else {
    return 'document';
  }
};

// Baixar documento
export const downloadDocument = async (url: string, filename: string): Promise<void> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar o URL do objeto
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error('Erro ao baixar documento:', error);
    throw error;
  }
};

// Verificar se um prestador tem documentos
export const hasProviderDocuments = async (providerId: string): Promise<boolean> => {
  const documents = await getProviderDocuments(providerId);
  return documents !== null && Object.keys(documents.documents).length > 0;
};

// Obter estatísticas de documentos
export const getDocumentsStats = async (): Promise<{
  totalProviders: number;
  providersWithDocuments: number;
  totalDocuments: number;
  documentsByType: Record<string, number>;
}> => {
  const providers = await getAllPendingProviders();
  
  const stats = {
    totalProviders: providers.length,
    providersWithDocuments: providers.length,
    totalDocuments: 0,
    documentsByType: {} as Record<string, number>
  };

  providers.forEach(provider => {
    Object.values(provider.documents).forEach(documents => {
      if (documents) {
        stats.totalDocuments += documents.length;
        documents.forEach(doc => {
          stats.documentsByType[doc.type] = (stats.documentsByType[doc.type] || 0) + 1;
        });
      }
    });
  });

  return stats;
};
