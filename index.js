const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "botversatil123"; // Token de verificação do Webhook
const PORT = process.env.PORT || 3000;

// 📌 AQUI VOCÊ DEVE INSERIR:
// - SEU PHONE_NUMBER_ID (ID do seu número do WhatsApp)
// - SEU ACCESS_TOKEN (Token de acesso que o Meta forneceu)
const PHONE_NUMBER_ID = "612860251919282"; // <<--- Troque aqui
const ACCESS_TOKEN = "EAAKPcTox91YBOyzca15eiBqs5D6f2Y6tjbQZBhPWvMie5ifGzQRXnpCbXZB0vd2XDzWtHSmamavbnW37pob3ZBOInQ4iA9L6ucsJ6B3hjqTdnCvLLs5G2eSaSlJhFVkKXF4Et2V5rKZBATaMCDp99LiuzDD1ZAlSu4Nqyrd7AzAfCZAruG6OlBmC726MK6k0TjZBpBeZA6MFcHEKNuEJdmFIsP8oluKeg2ZCSEJkZD";       // <<--- Troque aqui

// Função para verificar horário de atendimento
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
        await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: "whatsapp",
            to: destino,
            text: { body: mensagem }
        }, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`Mensagem enviada para ${destino}: ${mensagem}`);
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error.response?.data || error.message);
    }
}

// Webhook para verificação inicial (quando configurar no Meta)
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

// Webhook para receber mensagens
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;
            const contactName = body.entry[0].changes[0].value.contacts[0].profile.name || "Cliente";

            console.log(`📩 Mensagem recebida de ${from}:`, JSON.stringify(message));

            let tipoMensagem = message.type; // Tipo: text, button, interactive, etc.

            if (tipoMensagem === "text") {
                const texto = message.text.body || "";

                if (texto.length < 20) { // Se o texto for curto (tipo "Olá", "Oi")
                    if (dentroDoHorario()) {
                        await enviarMensagem(from, `Olá, ${contactName}! Tudo bem?`);
                        await enviarMensagem(from, `Seja bem-vindo ao nosso atendimento automático. 🚛\nAntes de começarmos, me diga com quem estou falando:\n\n1️⃣ - Sou Funcionário / Embarcador\n2️⃣ - Sou Cliente / Motorista`);
                    } else {
                        await enviarMensagem(from, `Olá! No momento estamos fora do horário de atendimento.\n\n📅 Nosso horário:\nSegunda a Sexta: 8h às 22h\nSábado e Domingo: 8h às 17h.\n\nPor favor, retorne nesse período. Agradecemos!`);
                    }
                } else {
                    await enviarMensagem(from, `Recebemos sua mensagem! Em breve um atendente entrará em contato. 🚛`);
                }
            } else if (tipoMensagem === "button" || tipoMensagem === "interactive") {
                await enviarMensagem(from, `Obrigado por interagir! Nossa equipe responderá em breve. 🚛`);
            } else {
                console.log('⚠ Tipo de mensagem não tratado:', tipoMensagem);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// Inicializar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
