import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";

const AUTH_FOLDER = "auth_baileys";

export async function connectWhatsApp({ onReady } = {}) {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\nEscaneie o QR code abaixo no WhatsApp (Aparelhos conectados):\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log("[whatsapp] Conexao fechada.", { shouldReconnect });
      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp({ onReady }), 3000);
      } else {
        console.log("[whatsapp] Sessao deslogada. Apague a pasta auth_baileys e rode novamente para logar de novo.");
      }
    } else if (connection === "open") {
      console.log("[whatsapp] Conectado com sucesso.");
      if (onReady) onReady(sock);
    }
  });

  return sock;
}

export async function sendTextToGroup(sock, groupId, text) {
  if (!groupId) {
    throw new Error("WHATSAPP_GROUP_ID nao configurado no .env");
  }
  return sock.sendMessage(groupId, { text });
}

export async function sendImageToGroup(sock, groupId, imageUrl, caption) {
  if (!groupId) {
    throw new Error("WHATSAPP_GROUP_ID nao configurado no .env");
  }
  return sock.sendMessage(groupId, { image: { url: imageUrl }, caption });
}
