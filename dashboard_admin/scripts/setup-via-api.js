#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuração
const API_URL = process.env.API_URL || 'http://localhost:3000';
const ENDPOINT = '/api/setup-adminmaster';

console.log('🚀 Executando setup do AdminMaster via API...');
console.log(`📡 Conectando em: ${API_URL}${ENDPOINT}`);

// Dados para enviar
const setupData = {
  email: 'master@aquiresolve.com',
  password: 'admin123',
  nome: 'Administrador Master'
};

// Configurar requisição
const postData = JSON.stringify(setupData);
const url = new URL(API_URL + ENDPOINT);
const isHttps = url.protocol === 'https:';
const client = isHttps ? https : http;

const options = {
  hostname: url.hostname,
  port: url.port || (isHttps ? 443 : 80),
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('📤 Enviando dados de configuração...');

const req = client.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      if (result.success) {
        console.log('✅ Setup concluído com sucesso!');
        console.log('📧 Email:', result.data.adminMaster.email);
        console.log('🔑 Senha:', result.data.adminMaster.senha);
        console.log('👥 Usuários criados:', result.data.usuarios);
        console.log('\n📊 Estrutura criada:');
        Object.entries(result.data.estrutura).forEach(([key, value]) => {
          console.log(`   - ${key}: ${value}`);
        });
        console.log('\n🌐 Acesse /master para gerenciar usuários e permissões');
      } else {
        console.error('❌ Setup falhou:', result.message);
        if (result.error) {
          console.error('Erro:', result.error);
        }
        if (result.missing) {
          console.error('Variáveis ausentes:', result.missing.join(', '));
        }
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error.message);
      console.error('Resposta recebida:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  console.log('\n💡 Dicas:');
  console.log('   - Verifique se o servidor está rodando');
  console.log('   - Verifique se as variáveis de ambiente estão configuradas');
  console.log('   - Tente acessar /setup-adminmaster no navegador');
});

req.write(postData);
req.end();
