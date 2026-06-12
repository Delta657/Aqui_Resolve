"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, FileText, Calendar } from "lucide-react"

export default function PrivacyPolicyPage() {
  const version = "1.0"
  const lastUpdate = "2024-01-15"

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Shield className="h-8 w-8 text-orange-600" />
          <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        </div>
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span>Versão {version}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>Última atualização: {lastUpdate}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. Introdução</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Esta Política de Privacidade descreve como coletamos, usamos,
              armazenamos e protegemos seus dados pessoais, em conformidade com
              a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
            <p>
              Ao utilizar nossos serviços, você concorda com as práticas
              descritas nesta política.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Dados Coletados</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <h4 className="font-semibold">2.1. Dados de Identificação</h4>
            <ul>
              <li>Nome completo</li>
              <li>E-mail</li>
              <li>Telefone</li>
              <li>CPF (quando necessário)</li>
              <li>Endereço</li>
            </ul>

            <h4 className="font-semibold mt-4">2.2. Dados de Uso</h4>
            <ul>
              <li>Histórico de pedidos e serviços</li>
              <li>Preferências e configurações</li>
              <li>Logs de acesso</li>
              <li>Dados de localização (quando necessário)</li>
            </ul>

            <h4 className="font-semibold mt-4">2.3. Dados de Pagamento</h4>
            <ul>
              <li>Informações de transações</li>
              <li>Métodos de pagamento (processados por terceiros seguros)</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Finalidade do Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>Utilizamos seus dados pessoais para:</p>
            <ul>
              <li>Prestação de serviços solicitados</li>
              <li>Execução de contratos</li>
              <li>Comunicação sobre serviços e atualizações</li>
              <li>Melhoria de nossos serviços</li>
              <li>Cumprimento de obrigações legais</li>
              <li>Prevenção de fraudes e segurança</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>4. Base Legal</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              O tratamento de seus dados pessoais é baseado nas seguintes
              hipóteses legais previstas na LGPD:
            </p>
            <ul>
              <li>
                <strong>Consentimento:</strong> Para marketing e comunicações
                promocionais
              </li>
              <li>
                <strong>Execução de Contrato:</strong> Para prestação de
                serviços
              </li>
              <li>
                <strong>Obrigação Legal:</strong> Para cumprimento de
                obrigações fiscais e legais
              </li>
              <li>
                <strong>Legítimo Interesse:</strong> Para melhorias e segurança
                do serviço
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>5. Compartilhamento de Dados</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Seus dados podem ser compartilhados com:
            </p>
            <ul>
              <li>
                <strong>Prestadores de Serviço:</strong> Para execução dos
                serviços solicitados
              </li>
              <li>
                <strong>Processadores de Pagamento:</strong> Para processamento
                de transações
              </li>
              <li>
                <strong>Autoridades:</strong> Quando exigido por lei
              </li>
            </ul>
            <p className="mt-4">
              Não vendemos seus dados pessoais a terceiros.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>6. Retenção de Dados</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Mantemos seus dados pessoais pelo tempo necessário para:
            </p>
            <ul>
              <li>Cumprir as finalidades descritas nesta política</li>
              <li>Atender obrigações legais e regulatórias</li>
              <li>Resolver disputas e fazer cumprir acordos</li>
            </ul>
            <p className="mt-4">
              Após o período de retenção, os dados são anonimizados ou
              excluídos de forma segura.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>7. Seus Direitos</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Conforme a LGPD, você tem direito a:
            </p>
            <ul>
              <li>
                <strong>Acesso:</strong> Obter confirmação e acesso aos seus
                dados
              </li>
              <li>
                <strong>Correção:</strong> Solicitar correção de dados
                incompletos ou desatualizados
              </li>
              <li>
                <strong>Exclusão:</strong> Solicitar exclusão de dados
                desnecessários ou tratados em desconformidade
              </li>
              <li>
                <strong>Portabilidade:</strong> Receber seus dados em formato
                estruturado
              </li>
              <li>
                <strong>Revogação:</strong> Revogar consentimento a qualquer
                momento
              </li>
              <li>
                <strong>Informação:</strong> Obter informações sobre o
                tratamento de seus dados
              </li>
            </ul>
            <p className="mt-4">
              Para exercer seus direitos, acesse a página{" "}
              <a href="/lgpd" className="text-orange-600 underline">
                Proteção de Dados
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>8. Segurança</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Implementamos medidas técnicas e organizacionais adequadas para
              proteger seus dados pessoais contra acesso não autorizado,
              alteração, divulgação ou destruição.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9. Contato</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Para questões sobre proteção de dados, entre em contato com nosso
              DPO (Data Protection Officer):
            </p>
            <ul>
              <li>E-mail: dpo@aquiresolve.com</li>
              <li>Telefone: (00) 0000-0000</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10. Alterações</CardTitle>
          </CardHeader>
          <CardContent className="prose">
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos
              sobre mudanças significativas e solicitaremos novo consentimento
              quando necessário.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


