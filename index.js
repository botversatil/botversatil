const venom = require('venom-bot');
const { verificarFuncionario } = require('./sheets');

venom
  .create()
  .then(client => start(client))
  .catch(err => console.error('Erro ao iniciar o bot:', err));

function start(client) {
  client.onMessage(async message => {
    const numero = message.from.replace('@c.us', '');

    if (message.body === '1') {
      const resultado = await verificarFuncionario(numero);
      if (resultado.autorizado) {
        await client.sendText(message.from, `✅ Acesso autorizado, ${resultado.nome}! Em que posso te ajudar?`);
      } else {
        await client.sendText(message.from, '❌ Este número não está cadastrado como Funcionário / Embarcador.');
      }
    }

    else if (message.body === '2') {
      await client.sendText(message.from, '🟢 Cliente / Motorista conectado. O que deseja?');
    }

    else if (message.body.toLowerCase() === 'oi' || message.body.toLowerCase() === 'olá') {
      await client.sendText(message.from, `👋 Olá! Seja bem-vindo ao nosso atendimento.

Com quem estou falando?

1️⃣ Sou Funcionário / Embarcador
2️⃣ Sou Cliente / Motorista`);
    }
  });
}
