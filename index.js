const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "botversatil123"; // Token para verificação do Webhook
const PORT = process.env.PORT || 3000;

// Função para verificar se está dentro do horário de atendimento
function dentroDoHorario() {
    const agora = new Date();
    const dia = agora.getDay(); // 0=Dom, 1=Seg, ..., 6=Sáb
    const hora = agora.getHours();

    if (dia >= 1 && dia <= 5) { // Segunda a Sexta
        return hora >= 8 && hora < 22;
    } else { // Sábado e Domingo
        return hora >= 8 && hora < 17;
    }
}

// Função para enviar mensagem
async function enviarMensagem(destino, mensagem) {
    try {
        await axios.post('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
            messaging_product: "whatsapp",
            to: destino,
            text: { body: mensagem }
        }, {
            headers: {
                'Authorization': `Bearer YOUR_ACCESS_TOKEN`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Mensagem enviada!');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    }
}

// Webhook GET para validação do Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// Webhook POST para receber mensagens
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from; // Número do remetente
            const msg_body = message.text.body || '';
            const profileName = body.entry[0].changes[0].value.contacts[0].profile.name || "Cliente"; // Nome do contato

            console.log(`Mensagem recebida de ${from}: ${msg_body}`);

            // Primeiro contato automático
            if (msg_body.length < 20) { // Se a mensagem for pequena, assume que é início
                if (dentroDoHorario()) {
                    await enviarMensagem(from, `Olá, ${profileName}! Tudo bem?`);
                    await enviarMensagem(from, `Seja bem-vindo ao nosso atendimento automático. 🚛\nAntes de começarmos, me diga com quem estou falando:\n\n1️⃣ - Sou Funcionário / Embarcador\n2️⃣ - Sou Cliente / Motorista`);
                } else {
                    await enviarMensagem(from, `Olá! No momento estamos fora do horário de atendimento.\n\n📅 Nosso horário:\nSegunda a Sexta: 8h às 22h\nSábado e Domingo: 8h às 17h.\n\nPor favor, retorne nesse período. Agradecemos!`);
                }
            } else {
                // Aqui você pode tratar opções de menu futuramente
                await enviarMensagem(from, `Recebemos sua mensagem! Em breve um atendente entrará em contato. 🚛`);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Inicializando servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
