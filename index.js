const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

// ⚙️ CONFIGURAÇÕES DO BOT
const VERIFY_TOKEN = "botversatil123"; // Token de verificação
const PHONE_NUMBER_ID = "SEU_PHONE_NUMBER_ID_AQUI"; // <<-- Trocar
const ACCESS_TOKEN = "SEU_ACCESS_TOKEN_AQUI"; // <<-- Trocar
const PORT = process.env.PORT || 3000;

// 📅 Valida horário comercial
function dentroDoHorario() {
    const agora = new Date();
    const dia = agora.getDay();
    const hora = agora.getHours();

    if (dia >= 1 && dia <= 5) { // Segunda a Sexta
        return hora >= 8 && hora < 22;
    } else { // Sábado e Domingo
        return hora >= 8 && hora < 17;
    }
}

// 💬 Envia mensagem de texto normal
async function enviarMensagemTexto(destino, mensagem) {
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
        console.log(`✅ Mensagem enviada para ${destino}`);
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem texto:', error.response?.data || error.message);
    }
}

// 🧩 Envia mensagem com BOTÕES
async function enviarMensagemComBotoes(destino, nomeContato) {
    try {
        await axios.post(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: destino,
            type: "interactive",
            interactive: {
                type: "button",
                body: {
                    text: `Olá, ${nomeContato}! 👋\nSeja bem-vindo ao nosso atendimento automático.\nComo podemos te ajudar?`
                },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: "FUNCIONARIO",
                                title: "🔵 Funcionário / Embarcador"
                            }
                        },
                        {
                            type: "reply",
                            reply: {
                                id: "CLIENTE",
                                title: "🟢 Cliente / Motorista"
                            }
                        }
                    ]
                }
            }
        }, {
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        console.log(`✅ Botões enviados para ${destino}`);
    } catch (error) {
        console.error('❌ Erro ao enviar botões:', error.response?.data || error.message);
    }
}

// 🔗 Webhook de verificação da Meta
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('🔗 Webhook verificado!');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

// 📩 Recebe mensagens do WhatsApp
app.post('/webhook', async (req, res) => {
    const body = req.body;

    if (body.object) {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (messages && messages.length > 0) {
            const message = messages[0];
            const from = message.from;
            const profileName = value.contacts?.[0]?.profile?.name || "Cliente";

            console.log(`📥 Mensagem recebida de ${profileName} (${from}): ${message.text?.body}`);

            if (message.type === "text") {
                const textoRecebido = message.text.body.trim();

                if (textoRecebido.length < 20) {
                    if (dentroDoHorario()) {
                        await enviarMensagemComBotoes(from, profileName);
                    } else {
                        await enviarMensagemTexto(from, `Olá, ${profileName}! 👋\nEstamos fora do nosso horário de atendimento.\n\n🕒 Horário de atendimento:\nSegunda a Sexta: 8h às 22h\nSábado e Domingo: 8h às 17h.`);
                    }
                } else {
                    await enviarMensagemTexto(from, `✅ Recebemos sua mensagem! Um atendente responderá em breve.`);
                }
            } else if (message.type === "interactive") {
                const respostaId = message.button?.payload || message.interactive?.button_reply?.id;

                if (respostaId === "FUNCIONARIO") {
                    await enviarMensagemTexto(from, `🔵 Ótimo! Encaminharemos você para o suporte de Funcionário / Embarcador.`);
                } else if (respostaId === "CLIENTE") {
                    await enviarMensagemTexto(from, `🟢 Perfeito! Encaminharemos você para o suporte de Cliente / Motorista.`);
                }
            }
        }

        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// 🚀 Start do servidor
app.listen(PORT, () => {
    console.log(`🟢 Servidor rodando na porta ${PORT}`);
});
