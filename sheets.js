const { google } = require('googleapis');
const credentials = require('./credentials.json');

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheetId = 'FuncionariosBot';

async function verificarFuncionario(numero) {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'Página1!A2:B',
  });

  const linhas = res.data.values;
  const encontrado = linhas.find(linha => linha[0] === numero);
  return encontrado ? { nome: encontrado[1], autorizado: true } : { autorizado: false };
}

module.exports = { verificarFuncionario };
