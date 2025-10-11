package com.example.loginapp

import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.example.loginapp.databinding.ActivityPrivacyPolicyBinding
import com.google.android.material.appbar.MaterialToolbar

class PrivacyPolicyActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPrivacyPolicyBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPrivacyPolicyBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupContent()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
            title = "Política de Privacidade"
        }
    }

    private fun setupContent() {
        binding.tvPrivacyContent.text = getPrivacyPolicyContent()
    }

    private fun getPrivacyPolicyContent(): String {
        return """
            POLÍTICA DE PRIVACIDADE
            
            Última atualização: ${java.time.LocalDate.now()}
            
            1. INFORMAÇÕES QUE COLETAMOS
            
            1.1 Informações Pessoais
            • Nome completo
            • Endereço de e-mail
            • Número de telefone
            • Nome de usuário
            • Tipo de usuário (cliente ou prestador de serviços)
            
            1.2 Informações de Uso
            • Dados de login e sessão
            • Histórico de pedidos e serviços
            • Avaliações e comentários
            • Preferências de comunicação
            
            1.3 Informações Técnicas
            • Endereço IP
            • Tipo de dispositivo
            • Sistema operacional
            • Versão do aplicativo
            
            2. COMO USAMOS SUAS INFORMAÇÕES
            
            2.1 Fornecimento de Serviços
            • Processar e gerenciar pedidos
            • Conectar clientes e prestadores
            • Facilitar pagamentos
            • Gerenciar avaliações e feedback
            
            2.2 Comunicação
            • Enviar notificações sobre pedidos
            • Informar sobre atualizações do app
            • Responder a solicitações de suporte
            • Enviar informações de marketing (com consentimento)
            
            2.3 Melhorias do Serviço
            • Analisar padrões de uso
            • Desenvolver novos recursos
            • Otimizar performance
            • Prevenir fraudes e abusos
            
            3. COMPARTILHAMENTO DE INFORMAÇÕES
            
            3.1 Prestadores de Serviços
            • Compartilhamos informações necessárias para prestação de serviços
            • Nome, localização e detalhes do pedido são compartilhados
            
            3.2 Parceiros de Pagamento
            • Dados de pagamento são processados por parceiros seguros
            • Não armazenamos informações de cartão de crédito
            
            3.3 Requisitos Legais
            • Podemos compartilhar dados quando exigido por lei
            • Para proteger direitos e segurança
            
            4. SEGURANÇA DOS DADOS
            
            4.1 Medidas de Proteção
            • Criptografia de dados em trânsito e repouso
            • Controles de acesso rigorosos
            • Monitoramento contínuo de segurança
            • Backups regulares
            
            4.2 Retenção de Dados
            • Mantemos dados enquanto necessário para prestação de serviços
            • Dados podem ser retidos por obrigações legais
            • Você pode solicitar exclusão de dados pessoais
            
            5. SEUS DIREITOS
            
            5.1 Acesso e Correção
            • Acessar seus dados pessoais
            • Corrigir informações incorretas
            • Atualizar preferências
            
            5.2 Exclusão
            • Solicitar exclusão de dados pessoais
            • Cancelar conta a qualquer momento
            • Retirar consentimento para marketing
            
            5.3 Portabilidade
            • Exportar seus dados em formato legível
            • Transferir dados para outros serviços
            
            6. COOKIES E TECNOLOGIAS SIMILARES
            
            6.1 Uso de Cookies
            • Melhorar experiência do usuário
            • Lembrar preferências
            • Analisar uso do aplicativo
            
            6.2 Controle de Cookies
            • Configurar preferências no dispositivo
            • Desabilitar cookies não essenciais
            
            7. MENORES DE IDADE
            
            7.1 Proteção de Menores
            • Não coletamos dados de menores de 13 anos
            • Pais/responsáveis devem supervisionar uso
            • Contate-nos se dados de menor forem coletados
            
            8. ALTERAÇÕES NA POLÍTICA
            
            8.1 Notificações
            • Alterações serão comunicadas por e-mail
            • Versão atualizada disponível no aplicativo
            • Continuar usando implica aceitação das mudanças
            
            9. CONTATO
            
            9.1 Dúvidas e Solicitações
            • E-mail: privacidade@aplicativoservico.com
            • Telefone: (11) 99999-9999
            • Horário: Segunda a Sexta, 9h às 18h
            
            9.2 Encarregado de Proteção de Dados
            • Responsável por questões de privacidade
            • Pode ser contatado pelo e-mail acima
            
            10. DISPOSIÇÕES FINAIS
            
            10.1 Lei Aplicável
            • Esta política é regida pela LGPD (Lei Geral de Proteção de Dados)
            • Disputas serão resolvidas nos tribunais brasileiros
            
            10.2 Aceitação
            • Ao usar nosso aplicativo, você aceita esta política
            • Recomendamos leitura completa antes do uso
        """.trimIndent()
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                onBackPressed()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    override fun onBackPressed() {
        super.onBackPressed()
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out)
    }
}




