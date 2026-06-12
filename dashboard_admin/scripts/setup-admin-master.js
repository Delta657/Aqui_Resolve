const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Configuração do Firebase
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

async function setupAdminMaster() {
  try {
    console.log('🔥 Inicializando Firebase...');
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
      }
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
        }
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
        }
      }
    ];

    for (const usuario of usuariosExemplo) {
      const usuarioRef = doc(db, 'adminmaster', 'master', 'usuarios', usuario.email.replace('@', '_at_'));
      await setDoc(usuarioRef, usuario);
      console.log(`✅ Usuário ${usuario.nome} criado`);
    }

    console.log('🎉 Configuração completa!');
    console.log('🌐 Acesse /master para gerenciar usuários e permissões');

  } catch (error) {
    console.error('❌ Erro ao configurar AdminMaster:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  setupAdminMaster();
}

module.exports = { setupAdminMaster };
