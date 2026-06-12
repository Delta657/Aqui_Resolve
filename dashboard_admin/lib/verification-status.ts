/**
 * Normaliza status de verificação vindos do app (PT/EN, caixa variada).
 */
export function mapRawVerificationStatus(status: unknown): 'pending' | 'approved' | 'rejected' {
  if (status == null || status === '') return 'pending'
  const s = String(status)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  if (
    ['verificado', 'verified', 'approved', 'approvado', 'aprovado', 'ativo_verificado'].includes(s)
  ) {
    return 'approved'
  }
  if (['rejected', 'rejeitado', 'recusado', 'negado', 'bloqueado_verificacao'].includes(s)) {
    return 'rejected'
  }
  if (
    [
      'pending',
      'pendente',
      'em_analise',
      'em analise',
      'under_review',
      'aguardando',
      'aguardando_verificacao',
      'aguardando verificacao',
      'analise',
      'in_review',
      'submitted',
      'enviado',
    ].includes(s)
  ) {
    return 'pending'
  }
  return 'pending'
}

/**
 * Status exibido na fila de aceitação: o cadastro em `providers` tem prioridade quando ainda está
 * pendente (evita `provider_verifications` desatualizado marcar como APPROVED com prestador ainda pendente).
 */
export function resolveQueueVerificationStatus(
  providerVerificationStatus: unknown,
  verifDocStatus: unknown
): 'pending' | 'approved' | 'rejected' {
  const p = mapRawVerificationStatus(providerVerificationStatus)
  const v =
    verifDocStatus != null && String(verifDocStatus).trim() !== ''
      ? mapRawVerificationStatus(verifDocStatus)
      : null

  if (p === 'rejected' || v === 'rejected') return 'rejected'

  // Cadastro principal ainda aguardando: prevalece sobre doc de verificação antigo/errado
  if (p === 'pending') return 'pending'

  if (v === 'pending') return 'pending'

  if (p === 'approved' && (v === null || v === 'approved')) return 'approved'
  if (v === 'approved') return 'approved'

  return p
}

/** Valores comuns em Firestore para query `in` (prestadores que devem aparecer na fila). */
export const PENDING_VERIFICATION_STATUS_IN_QUERY: string[] = [
  'pending',
  'pendente',
  'Pendente',
  'PENDING',
  'em_analise',
  'under_review',
]
