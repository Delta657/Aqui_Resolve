const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

// Configuração do Firebase usando variáveis do Vercel
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Função para hash de senha (simplificada para demonstração)
const hashPassword = (password) => {
  return Buffer.from(password).toString('base64');
};

async function setupAdminMasterVercel() {
  try {
    console.log('🔥 Inicializando Firebase com configuração do Vercel...');
    console.log('📋 Verificando variáveis de ambiente...');
    
    // Verificar se as variáveis estão definidas
    const requiredVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      console.error('❌ Variáveis de ambiente ausentes:', missingVars);
      console.log('💡 Configure as variáveis no Vercel ou no arquivo .env.local');
      return;
    }

    console.log('✅ Todas as variáveis de ambiente estão configuradas');
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log('👑 Configurando AdminMaster...');
    
    // Dados do AdminMaster padrão
    const adminMasterData = {
      email: 'master@aquiresolve.com',
      senhaHash: hashPassword('admin123'), // Senha padrão: admin123
      nome: 'Administrador Master',
      permissoes: {
        dashboard: true,
        controle: true,
        gestaoUsuarios: true,
        gestaoPedidos: true,
        financeiro: true,
        relatorios: true,
        configuracoes: true
      },
      criadoEm: new Date().toISOString(),
      ativo: true
    };

    // Criar documento AdminMaster na coleção 'adminmaster'
    const adminMasterRef = doc(db, 'adminmaster', 'master');
    await setDoc(adminMasterRef, adminMasterData);

    console.log('✅ AdminMaster configurado com sucesso!');
    console.log('📧 Email: master@aquiresolve.com');
    console.log('🔑 Senha: admin123');
    console.log('⚠️  IMPORTANTE: Altere a senha padrão em produção!');

    // Criar alguns usuários de exemplo
    console.log('👥 Criando usuários de exemplo...');
    
    const usuariosExemplo = [
      {
        nome: 'João Silva',
        email: 'joao@aquiresolve.com',
        permissoes: {
          dashboard: true,
          controle: true,
          gestaoUsuarios: false,
          gestaoPedidos: true,
          financeiro: false,
          relatorios: true,
          configuracoes: false
        },
        criadoEm: new Date().toISOString(),
        ativo: true
      },
      {
        nome: 'Maria Santos',
        email: 'maria@aquiresolve.com',
        permissoes: {
          dashboard: true,
          controle: false,
          gestaoUsuarios: true,
          gestaoPedidos: true,
          financeiro: true,
          relatorios: false,
          configuracoes: true
        },
        criadoEm: new Date().toISOString(),
        ativo: true
      },
      {
        nome: 'Pedro Costa',
        email: 'pedro@aquiresolve.com',
        permissoes: {
          dashboard: true,
          controle: true,
          gestaoUsuarios: false,
          gestaoPedidos: false,
          financeiro: true,
          relatorios: true,
          configuracoes: false
        },
        criadoEm: new Date().toISOString(),
        ativo: true
      }
    ];

    // Criar subcoleção de usuários
    const usuariosRef = collection(db, 'adminmaster', 'master', 'usuarios');
    
    for (const usuario of usuariosExemplo) {
      await addDoc(usuariosRef, usuario);
      console.log(`✅ Usuário ${usuario.nome} criado`);
    }

    // Criar configurações do sistema
    console.log('⚙️ Criando configurações do sistema...');
    
    const configuracoesRef = doc(db, 'adminmaster', 'master', 'configuracoes', 'sistema');
    await setDoc(configuracoesRef, {
      versao: '1.0.0',
      ultimaAtualizacao: new Date().toISOString(),
      permissoesPadrao: {
        dashboard: false,
        controle: false,
        gestaoUsuarios: false,
        gestaoPedidos: false,
        financeiro: false,
        relatorios: false,
        configuracoes: false
      },
      configuracoes: {
        maxUsuarios: 100,
        sessaoTimeout: 3600, // 1 hora em segundos
        logAtividades: true,
        notificacoes: true
      }
    });

    console.log('✅ Configurações do sistema criadas');

    // Criar logs de atividade
    console.log('📝 Criando logs de atividade...');
    
    const logsRef = collection(db, 'adminmaster', 'master', 'logs');
    await addDoc(logsRef, {
      tipo: 'sistema',
      acao: 'setup_inicial',
      descricao: 'Sistema AdminMaster configurado com sucesso',
      timestamp: new Date().toISOString(),
      usuario: 'sistema',
      ip: 'localhost'
    });

    console.log('✅ Log de atividade criado');

    console.log('🎉 Configuração completa!');
    console.log('🌐 Acesse /master para gerenciar usuários e permissões');
    console.log('📊 Estrutura criada:');
    console.log('   - adminmaster/master (documento principal)');
    console.log('   - adminmaster/master/usuarios (subcoleção de usuários)');
    console.log('   - adminmaster/master/configuracoes/sistema (configurações)');
    console.log('   - adminmaster/master/logs (logs de atividade)');

  } catch (error) {
    console.error('❌ Erro ao configurar AdminMaster:', error);
    console.error('Detalhes do erro:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAdminMasterVercel();
}

module.exports = { setupAdminMasterVercel };
