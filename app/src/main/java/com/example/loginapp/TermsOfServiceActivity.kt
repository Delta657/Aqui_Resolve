package com.example.loginapp

import android.os.Bundle
import android.view.MenuItem
import androidx.appcompat.app.AppCompatActivity
import com.example.loginapp.databinding.ActivityTermsOfServiceBinding

class TermsOfServiceActivity : AppCompatActivity() {

    private lateinit var binding: ActivityTermsOfServiceBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTermsOfServiceBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupToolbar()
        setupContent()
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
            title = "Termos de Uso"
        }
    }

    private fun setupContent() {
        binding.tvTermsContent.text = getTermsOfServiceContent()
    }

    private fun getTermsOfServiceContent(): String {
        return """
            TERMOS DE USO
            
            Última atualização: ${java.time.LocalDate.now()}
            
            1. ACEITAÇÃO DOS TERMOS
            
            1.1 Aceitação
            Ao acessar e usar este aplicativo, você concorda em cumprir e estar vinculado a estes Termos de Uso.
            
            1.2 Modificações
            Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações serão comunicadas através do aplicativo.
            
            2. DESCRIÇÃO DO SERVIÇO
            
            2.1 Plataforma de Serviços
            Este aplicativo conecta clientes que precisam de serviços com prestadores de serviços qualificados.
            
            2.2 Funcionalidades
            • Criação de pedidos de serviços
            • Conectividade entre clientes e prestadores
            • Sistema de pagamentos
            • Avaliações e feedback
            • Chat e comunicação
            
            3. CADASTRO E CONTA
            
            3.1 Elegibilidade
            • Você deve ter pelo menos 18 anos
            • Capacidade legal para contratar
            • Informações verdadeiras e precisas
            
            3.2 Responsabilidade da Conta
            • Manter senha segura
            • Não compartilhar credenciais
            • Notificar uso não autorizado
            • Responsável por atividades na conta
            
            3.3 Verificação
            • Podemos solicitar documentos de verificação
            • Reservamo-nos o direito de recusar cadastros
            • Verificação pode ser obrigatória para certos serviços
            
            4. USO DO SERVIÇO
            
            4.1 Uso Permitido
            • Uso pessoal e não comercial
            • Conformidade com leis aplicáveis
            • Respeito aos direitos de terceiros
            
            4.2 Uso Proibido
            • Atividades ilegais ou fraudulentas
            • Spam ou comunicação não solicitada
            • Interferência na operação do sistema
            • Violação de direitos de propriedade intelectual
            • Assédio ou comportamento abusivo
            
            4.3 Conteúdo do Usuário
            • Você mantém direitos sobre seu conteúdo
            • Concede licença para uso na plataforma
            • Responsável pela veracidade do conteúdo
            • Não pode violar direitos de terceiros
            
            5. SERVIÇOS E PAGAMENTOS
            
            5.1 Contratação de Serviços
            • Cliente contrata diretamente com prestador
            • Aplicativo atua como intermediário
            • Termos específicos entre cliente e prestador
            
            5.2 Pagamentos
            • Processados por parceiros seguros
            • Taxas podem ser aplicadas
            • Reembolsos conforme política específica
            • Responsabilidade por pagamentos autorizados
            
            5.3 Disputas
            • Resolução entre cliente e prestador
            • Suporte disponível para mediação
            • Não nos responsabilizamos por disputas
            
            6. RESPONSABILIDADES
            
            6.1 Limitação de Responsabilidade
            • Serviço fornecido "como está"
            • Não garantimos disponibilidade contínua
            • Limitação de danos conforme lei aplicável
            
            6.2 Responsabilidade do Usuário
            • Cumprimento dos termos
            • Veracidade das informações
            • Conduta adequada na plataforma
            • Respeito aos outros usuários
            
            6.3 Indenização
            • Você concorda em indenizar por danos causados
            • Inclui custos legais e administrativos
            • Relacionados ao uso inadequado do serviço
            
            7. PROPRIEDADE INTELECTUAL
            
            7.1 Direitos da Plataforma
            • Marca registrada e direitos autorais
            • Conteúdo e design protegidos
            • Não pode ser copiado ou modificado
            
            7.2 Licença de Uso
            • Licença limitada para uso pessoal
            • Não transferível
            • Revogável a qualquer momento
            
            8. PRIVACIDADE E DADOS
            
            8.1 Política de Privacidade
            • Coleta e uso conforme política específica
            • Consentimento para processamento de dados
            • Direitos de proteção de dados
            
            8.2 Segurança
            • Medidas de segurança implementadas
            • Não garantimos segurança absoluta
            • Responsabilidade compartilhada
            
            9. SUSPENSÃO E TÉRMINO
            
            9.1 Suspensão
            • Podemos suspender conta por violações
            • Notificação prévia quando possível
            • Acesso restrito durante investigação
            
            9.2 Término
            • Você pode cancelar a qualquer momento
            • Podemos encerrar por violações graves
            • Efeitos do encerramento
            
            9.3 Sobrevivência
            • Certas cláusulas sobrevivem ao término
            • Inclui responsabilidades e limitações
            
            10. DISPOSIÇÕES GERAIS
            
            10.1 Lei Aplicável
            • Regido pelas leis brasileiras
            • Foro competente em São Paulo/SP
            
            10.2 Disputas
            • Tentativa de resolução amigável
            • Mediação quando aplicável
            • Jurisdição exclusiva dos tribunais brasileiros
            
            10.3 Divisibilidade
            • Cláusulas independentes
            • Invalidade de uma não afeta outras
            
            10.4 Renúncia
            • Renúncia deve ser por escrito
            • Não afeta outros direitos
            
            10.5 Acordo Completo
            • Estes termos constituem acordo completo
            • Substitui acordos anteriores
            
            11. CONTATO
            
            11.1 Dúvidas
            • E-mail: termos@aplicativoservico.com
            • Telefone: (11) 99999-9999
            • Horário: Segunda a Sexta, 9h às 18h
            
            11.2 Notificações
            • Notificações por e-mail ou aplicativo
            • Consideradas recebidas em 24h
            • Endereço de cadastro válido
            
            12. VERSÃO E ATUALIZAÇÕES
            
            12.1 Versão Atual
            • Versão 1.0 - ${java.time.LocalDate.now()}
            • Histórico de alterações disponível
            
            12.2 Atualizações
            • Notificação de mudanças importantes
            • Continuar usando implica aceitação
            • Direito de recusar e cancelar conta
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




