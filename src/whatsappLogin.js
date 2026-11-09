import { connectWhatsApp } from "./whatsapp.js";

console.log("Iniciando login no WhatsApp... escaneie o QR code quando aparecer.");

connectWhatsApp({
  onReady: () => {
    console.log("Login concluido! A sessao foi salva em auth_baileys/.");
    console.log("Agora rode: npm run list-groups  (para descobrir o ID do grupo de achadinhos)");
  },
});
