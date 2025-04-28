
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot Versátil rodando! 🚛');
});

app.post('/webhook', async (req, res) => {
    const incomingMessage = req.body;

    console.log("Mensagem recebida:", JSON.stringify(incomingMessage, null, 2));

    const mensagemTexto = incomingMessage.messages?.[0]?.text?.body || '';

    if (mensagemTexto.toLowerCase().includes('oi')) {
        await enviarMensagem("Olá! Seja bem-vindo ao nosso atendimento automático 🚛");
    } else {
        await enviarMensagem("Mensagem recebida! Em breve entraremos em contato.");
    }

    res.sendStatus(200);
});

async function enviarMensagem(mensagem) {
    try {
        await axios.post('https://apiURLdaSuaAPIdeWhatsApp.com/v1/messages', {
            messaging_product: "whatsapp",
            to: "seunumerodestino",
            text: { body: mensagem }
        }, {
            headers: {
                'Authorization': `Bearer SUA_API_KEY`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Mensagem enviada!');
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    }
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
