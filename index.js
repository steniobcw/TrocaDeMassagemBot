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
    "Vamos cadastrar você! \n\n" +
      "Por favor, responda **copiando e preenchendo** o modelo abaixo:\n\n" +
      "Nome: [seu nome completo]\n" +
      "ContatoTelegram: [@seuusuario]\n" +
      "Telefone: [número de contato, preferencialmente WhatsApp]\n" +
      "Modalidades: [modalidades separadas por vírgula]\n" +
      "AtendeDomicilio: [Sim/Não]\n" +
      "LocalProprio: [Sim/Não]\n" +
      "Bairros: [bairros onde atende, separados por vírgula]\n\n" +
      "Exemplo:\n" +
      "Nome: João Silva\n" +
      "ContatoTelegram: @joaomassagem\n" +
      "Telefone: 31999998888\n" +
      "Modalidades: Relaxante, Tântrica\n" +
      "AtendeDomicilio: Sim\n" +
      "LocalProprio: Não\n" +
      "Bairros: Funcionários, Savassi"
  );
});
/*
//descobrir chat id
bot.on("message", (ctx) => {
  console.log("CHAT ID:", ctx.chat.id);
});
*/
// ---------------- ON MESSAGE (data entry) ----------------
bot.on("text", async (ctx) => {
  const text = ctx.message.text;

  // Verificamos se contém as palavras-chave dos campos
  if (
    !text.includes("Nome:") ||
    !text.includes("ContatoTelegram:") ||
    !text.includes("Telefone:") ||
    !text.includes("Modalidades:") ||
    !text.includes("AtendeDomicilio:") ||
    !text.includes("LocalProprio:") ||
    !text.includes("Bairros:")
  ) {
    return;
  }

  // Separar por linhas
  const lines = text.split("\n").map((l) => l.trim());
  let dados = {};
  lines.forEach((linha) => {
    if (linha.startsWith("Nome:"))
      dados.nome = linha.replace("Nome:", "").trim();

    if (linha.startsWith("ContatoTelegram:"))
      dados.contatoTelegram = linha.replace("ContatoTelegram:", "").trim();

    if (linha.startsWith("Telefone:"))
      dados.telefone = linha.replace("Telefone:", "").trim();

    if (linha.startsWith("Modalidades:"))
      dados.modalidades = linha.replace("Modalidades:", "").trim();

    if (linha.startsWith("AtendeDomicilio:"))
      dados.atendeDomicilio = linha.replace("AtendeDomicilio:", "").trim();

    if (linha.startsWith("LocalProprio:"))
      dados.localProprio = linha.replace("LocalProprio:", "").trim();

    if (linha.startsWith("Bairros:"))
      dados.bairros = linha.replace("Bairros:", "").trim();
  });

  // Validar se todos os campos existem
  const camposObrigatorios = [
    "nome",
    "contatoTelegram",
    "atendeDomicilio",
    "localProprio",
  ];

  for (let campo of camposObrigatorios) {
    if (!dados[campo] || dados[campo].length === 0) {
      ctx.reply(`⚠️ O campo *${campo}* não foi preenchido corretamente.`);
      return;
    }
  }

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
    ctx.reply("❌ Erro ao salvar seus dados. Tente novamente mais tarde.");
  }
});
// Mensagem automática quando alguém entra no grupo
bot.on("new_chat_members", async (ctx) => {
  const novos = ctx.message.new_chat_members;

  for (const membro of novos) {
    const nome = membro.first_name || "visitante";
    const mensagem = `👋 Olá, *${nome}*!\n\nBem-vindo(a) ao grupo de troca de massagem!\n
Aqui você pode:\n
Receber o relaxamento que tanto proporciona aos seus clientes.\n
Encontrar alguem disposto a ser modelo para praticar em seus cursos.\n
Aprender e compartilhar tecnicas e procedimentos de massoterapia.\n
Entre outras coisas!\n\n
Se precisar de ajuda, digite /queromassagem para ver os comandos disponíveis.\n\n
Fique à vontade! 😉`;
    await ctx.reply(mensagem, { parse_mode: "Markdown" });
  }
});

// ---------------- START BOT ----------------
bot.launch();
bot.telegram.getMe().then(() => {
  console.log("Bot iniciado com sucesso!");
  const mensagens = [
    "👋 Olá!\n 🤖 Sou um robó massagista e foi iniciado agora. Segue as mensagens pendentes das solicitações feitas enquanto eu estava inativo! Agora que estou acordado posso responder rapidamente.",
    "👋 Olá",
  ];
  const nm = Math.random() < 0.1 ? 1 : 0;
  bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, mensagens[nm]);
});

// Enviar mensagem ao desligar o bot

const sendShutdownMessage = async () => {
  try {
    const mensagens = [
      "👋 ⚠️ Estou sendo desligado! Se fizerem soliciatações enquanto estou offline, não poderei respondê-las até que eu seja reiniciado. mas continuem interagindo entre vocês! façam boas massagens e relaxem!",
      "👋 Tcháu",
    ];
    const nm = Math.random() < 0.1 ? 1 : 0;
    await bot.telegram.sendMessage(process.env.ADMIN_CHAT_ID, mensagens[nm]);
  } catch (err) {
    console.log("Não foi possível enviar mensagem ao desligar:", err.message);
  }
};

// Captura encerramento manual (Ctrl + C)
process.on("SIGINT", async () => {
  console.log("Encerrando com SIGINT...");
  await sendShutdownMessage();
  process.exit(0);
});

// Encerramento pelo sistema
process.on("SIGTERM", async () => {
  console.log("Encerrando com SIGTERM...");
  await sendShutdownMessage();
  process.exit(0);
});
