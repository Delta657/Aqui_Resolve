import dotenv from 'dotenv';
import App from './app';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do servidor
const PORT = parseInt(process.env['PORT'] || '3001', 10);
const NODE_ENV = process.env['NODE_ENV'] || 'development';

// Criar instância da aplicação
const app = new App();

// Inicializar servidor
app.listen(PORT);

// Log de inicialização
console.log('='.repeat(50));
console.log('🎯 Painel Administrativo - API');
console.log('='.repeat(50));
console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
console.log(`🌍 Ambiente: ${NODE_ENV}`);
console.log(`🔧 Porta: ${PORT}`);
console.log(`🔗 URL: http://localhost:${PORT}`);
console.log('='.repeat(50));

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});
