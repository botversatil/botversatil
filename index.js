const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "botversatil123"; // Token que você vai cadastrar no WhatsApp API
const PORT = process.env.PORT || 3000;

// Rota para verificação do webhook
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

// Rota para receber mensagens
app.post('/webhook', async (req, res) => {
    const body = req.body;

    console.log(JSON.stringify(body, null, 2));

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from; // Número do remetente
            const msg_body = message.text.body; // Texto da mensagem

            console.log(`Mensagem recebida de ${from}: ${msg_body}`);

            // Responder a mensagem recebida
            await enviarMensagem(from, "Olá! Recebemos sua mensagem. Em breve entraremos em contato 🚛");
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Função para enviar mensagens
async function enviarMensagem(to, mensagem) {
    try {
        await axios.post('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
            messaging_product: "whatsapp",
            to: to,
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

// Inicializando o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
