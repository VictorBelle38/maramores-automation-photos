const fs = require('fs');
const path = require('path');

// Função para substituir variáveis de ambiente no HTML
function buildWithEnv() {
    try {
        // Carrega as variáveis de ambiente
        require('dotenv').config();
        
        // Lê o arquivo HTML
        let html = fs.readFileSync('index.html', 'utf8');
        
        // Substitui as variáveis de ambiente
        const replacements = {
            '{{WEBHOOK_URL}}': process.env.WEBHOOK_URL || 'https://n8n.remotedok.fun/form/REPLACE_WITH_YOUR_WEBHOOK_ID'
        };
        
        // Aplica as substituições
        Object.entries(replacements).forEach(([placeholder, value]) => {
            html = html.replace(new RegExp(placeholder, 'g'), value);
        });
        
        // Cria diretório dist se não existir
        if (!fs.existsSync('dist')) {
            fs.mkdirSync('dist');
        }
        
        // Salva o arquivo buildado
        fs.writeFileSync('dist/index.html', html);
        
        console.log('✅ Build concluído com sucesso!');
        console.log('📁 Arquivo gerado: dist/index.html');
        
    } catch (error) {
        console.error('❌ Erro durante o build:', error.message);
        process.exit(1);
    }
}

// Executa o build
buildWithEnv();
