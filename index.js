// Telegram Bot with Node.js + Telegraf + Google Sheets
// ----------------------------------------------------
// BEFORE RUNNING:
// 1. Install dependencies:
//    npm install telegraf googleapis
// 2. Create a Google Cloud project and enable Sheets API
// 3. Create a Service Account and download the JSON key
// 4. Share your Google Sheet with the service account email (Editor)
// 5. Create a .env file with:
//    BOT_TOKEN=your_telegram_bot_token
//    GOOGLE_SHEETS_ID=your_sheet_id
//    GOOGLE_SERVICE_ACCOUNT_EMAIL=your_sa_email
//    GOOGLE_PRIVATE_KEY="your_private_key"
// ----------------------------------------------------

import { Telegraf } from "telegraf";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// ---------------- GOOGLE SHEETS CLIENT ----------------
export async function getSheetsClient() {
  const auth = new google.auth.JWT({
    email: process.env.GS_ACCOUNT_EMAIL,
    key: process.env.GS_PRIVATE_KEY.replace(/\\n/g, "\n"),
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive",
    ],
  });

  return google.sheets({ version: "v4", auth });
}

// ---------------- COMMAND: /queromassagem ----------------
bot.command("queromassagem", async (ctx) => {
  await ctx.reply(
    `📋 Lista de comandos:

/queromassagem – Lista de comandos
/vermassagistas – Ver lista completa
/soumassagista – Adicionar ou editar meus dados`
  );
});

// ---------------- COMMAND: /vermassagistas ----------------
bot.command("vermassagistas", async (ctx) => {
  try {
    const sheets = await getSheetsClient();
    console.log(process.env.GOOGLE_SHEETS_ID);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Massagistas!A2:G",
    });

    const rows = res.data.values || [];

    if (!rows.length) return ctx.reply("Nenhum massagista cadastrado ainda.");

    let msg = "💆‍♂️ Massagistas cadastrados:\n\n";
    rows.forEach((row) => {
      const [
        nome,
        contatoTelegram,
        telefone,
        modalidades,
        atendeDomicilio,
        localProprio,
        bairros,
      ] = row;
      msg += `📌 *${nome}*
📱 Telegram: ${contatoTelegram}
📞 Telefone: ${telefone}
💆 Modalidades: ${modalidades}
🏠 Atende domicílio: ${atendeDomicilio}
🏢 Local próprio: ${localProprio}
📍 Bairros: ${bairros}\n\n`;
    });

    await ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (err) {
    console.error(err);
    ctx.reply("Erro ao acessar a lista.");
  }
});

// ---------------- COMMAND: /soumassagista ----------------
bot.command("soumassagista", async (ctx) => {
  ctx.reply(
    "Vamos cadastrar você! Envie seus dados exatamente no formato:\n\n" +
      "Nome - ContatoTelegram - Telefone - Modalidades - AtendeDomicilio - LocalProprio - Bairros\n\n" +
      "Exemplo:\nJoão Silva - @joaomassagem - 31999998888 - Relaxante, Tantra - Sim - Não - Funcionários, Savassi"
  );
});

// ---------------- ON MESSAGE (data entry) ----------------
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  if (!text.includes(" - ")) return;

  const parts = text.split(" - ");
  if (parts.length !== 7) return;

  const [
    nome,
    contatoTelegram,
    telefone,
    modalidades,
    atendeDomicilio,
    localProprio,
    bairros,
  ] = parts.map((v) => v.trim());

  try {
    const sheets = await getSheetsClient();

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: "Massagistas!A2",
      valueInputOption: "RAW",
      requestBody: {
        values: [
          [
            nome,
            contatoTelegram,
            telefone,
            modalidades,
            atendeDomicilio,
            localProprio,
            bairros,
          ],
        ],
      },
    });

    ctx.reply("✔️ Seus dados foram cadastrados com sucesso!");
  } catch (err) {
    console.error(err);
    ctx.reply("Erro ao salvar seus dados.");
  }
});
// Mensagem automática quando alguém entra no grupo
bot.on("new_chat_members", async (ctx) => {
  const novos = ctx.message.new_chat_members;

  for (const membro of novos) {
    const nome = membro.first_name || "visitante";

    await ctx.reply(
      `👋 Olá, *${nome}*!\n\nBem-vindo(a) ao grupo de troca de massagem!\n
Aqui você pode:\n
Receber o relaxamento que tanto proporciona aos seus clientes.\n
Encontrar alguem disposto a ser modelo para praticar em seus cursos.\n
Aprender e compartilhar tecnicas e procedimentos de massoterapia.\n
Entre outras coisas!\n\n
Se precisar de ajuda, digite /queromassagem para ver os comandos disponíveis.\n\n
Fique à vontade! 😉`,
      { parse_mode: "Markdown" }
    );
  }
});

// ---------------- START BOT ----------------
bot.launch();
console.log("Bot rodando...");
