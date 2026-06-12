export interface User {
  id: string
  role: "cliente" | "prestador" | "admin" | "operador"
  nome: string
  email: string
  telefone?: string
  cpf?: string
  endereco?: string
  rating?: number
  status: "ativo" | "inativo" | "bloqueado"
  createdAt: Date
  lastLogin?: Date
}

export interface Profissional {
  id: string
  nome: string
  categorias: string[]
  documentoUrls: string[]
  verificado: boolean
  status: "ativo" | "inativo" | "pendente"
  createdAt: Date
}

export interface Servico {
  id: string
  protocolo: string
  empresa: string
  cnpj: string
  clienteNome: string
  beneficiario: string
  telefone: string
  cidade: string
  logradouro: string
  bairro: string
  dataHora: Date
  status: "agendado" | "aceito" | "aguardando" | "nao_enviado" | "em_andamento" | "concluido" | "cancelado"
  prioridade: "baixa" | "media" | "alta" | "urgente"
  responsavel?: string
  placa?: string
  renavam?: string
  veiculo?: string
  coordenadas?: { lat: number; lng: number }
  km?: number
  tempo?: number
  observacoes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Orcamento {
  id: string
  numero: string
  produto: string
  clienteId: string
  profissionalId?: string
  placa?: string
  veiculo?: string
  servicoId?: string
  cidadeOrigem: string
  cidadeDestino: string
  status: "pendente" | "aprovado" | "rejeitado" | "expirado"
  total: number
  observacao?: string
  createdAt: Date
}

export interface FinanceiroTransacao {
  id: string
  tipo: "receita" | "despesa"
  origem: string
  servicoId?: string
  valor: number
  status: "pendente" | "pago" | "cancelado"
  metodo: "dinheiro" | "cartao" | "pix" | "transferencia"
  data: Date
  createdAt: Date
}

export interface KPIData {
  servicosCadastrados: number
  servicosConcluidos: number
  servicosEmAndamento: number
  tmcDia: number
  melhorTmcMes: { nome: string; tempo: number }
  servicosDesteMes: number
  tmeMes: number
  kmPercorridosHoje: number
  canceladosHoje: number
  recusadosNoMes: number
  piorTmcMes: { nome: string; tempo: number }
  receitaMes: { prevista: number; faturada: number }
}
