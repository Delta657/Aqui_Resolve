/**
 * Middleware para registro automático de atividades de processamento de dados pessoais
 */

import { LGPDService } from '@/lib/services/lgpd-service'
import type { ProcessingActivity, LegalBasis } from '@/types/lgpd'

interface LogContext {
  userId: string
  userEmail: string
  activity: ProcessingActivity
  dataTypes: string[]
  legalBasis: LegalBasis
  purpose: string
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, any>
}

/**
 * Registrar atividade de processamento de dados pessoais
 */
export async function logDataProcessing(context: LogContext): Promise<void> {
  try {
    await LGPDService.logProcessingActivity(
      context.userId,
      context.userEmail,
      context.activity,
      context.dataTypes,
      context.legalBasis,
      context.purpose,
      context.ipAddress,
      context.userAgent,
      context.metadata
    )
  } catch (error) {
    // Não falhar a requisição se o log falhar
    console.error('Erro ao registrar log LGPD:', error)
  }
}

/**
 * Helper para extrair tipos de dados de um objeto
 */
export function extractDataTypes(data: Record<string, any>): string[] {
  const dataTypes: string[] = []
  const sensitiveFields: Record<string, string> = {
    email: 'email',
    telefone: 'telefone',
    phone: 'telefone',
    cpf: 'cpf',
    cnpj: 'cnpj',
    endereco: 'endereco',
    address: 'endereco',
    nome: 'nome',
    name: 'nome',
    rg: 'rg',
    dataNascimento: 'data_nascimento',
    birthDate: 'data_nascimento',
  }

  for (const [key, type] of Object.entries(sensitiveFields)) {
    if (data[key] !== undefined && data[key] !== null) {
      dataTypes.push(type)
    }
  }

  return [...new Set(dataTypes)]
}

/**
 * Helper para determinar base legal baseada na atividade
 */
export function getLegalBasisForActivity(
  activity: ProcessingActivity
): LegalBasis {
  const basisMap: Record<ProcessingActivity, LegalBasis> = {
    criacao_usuario: 'execucao_contrato',
    atualizacao_usuario: 'execucao_contrato',
    exclusao_usuario: 'obrigacao_legal',
    login: 'legitimo_interesse',
    acesso_dados: 'obrigacao_legal',
    exportacao_dados: 'obrigacao_legal',
    compartilhamento_dados: 'execucao_contrato',
    processamento_pedido: 'execucao_contrato',
    analise_comportamental: 'consentimento',
  }

  return basisMap[activity] || 'legitimo_interesse'
}


