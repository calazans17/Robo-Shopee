import cron from "node-cron";
import { config } from "./src/config.js";
import { connectWhatsApp, sendTextToGroup, sendImageToGroup } from "./src/whatsapp.js";
import { fetchOffers } from "./src/shopeeClient.js";
import { formatOfferCaption, formatOffersMessage } from "./src/formatMessage.js";

const DELAY_BETWEEN_OFFERS_MS = 4000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendDailyOffers(sock) {
  try {
    console.log("[job] Buscando ofertas na Shopee...");
    const offers = await fetchOffers(config.offersPerDay);

    if (!offers.length) {
      console.log("[job] Nenhuma oferta encontrada, enviando aviso.");
      await sendTextToGroup(sock, config.whatsapp.groupId, formatOffersMessage(offers));
      return;
    }

    console.log(`[job] Enviando ${offers.length} oferta(s) para o grupo...`);
    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i];
      const caption = formatOfferCaption(offer, i);
      await sendImageToGroup(sock, config.whatsapp.groupId, offer.imageUrl, caption);
      console.log(`[job] Oferta ${i + 1}/${offers.length} enviada.`);
      if (i < offers.length - 1) await delay(DELAY_BETWEEN_OFFERS_MS);
    }
    console.log("[job] Todas as ofertas enviadas com sucesso.");
  } catch (err) {
    console.error("[job] Erro ao enviar ofertas diarias:", err);
  }
}

// O onReady roda de novo a cada reconexao do WhatsApp. Guardamos sempre o
// socket mais recente e agendamos o cron uma unica vez, senao cada reconexao
// criaria um job a mais e o grupo receberia as ofertas repetidas.
let currentSock = null;
let scheduled = false;

connectWhatsApp({
  onReady: (sock) => {
    currentSock = sock;
    if (scheduled) return;
    scheduled = true;

    console.log(`[scheduler] Agendado para rodar com cron "${config.scheduleCron}"`);
    cron.schedule(config.scheduleCron, () => sendDailyOffers(currentSock), {
      timezone: "America/Sao_Paulo",
    });

    // Descomente a linha abaixo para testar o envio imediatamente, sem esperar o horario:
    // sendDailyOffers(currentSock);
  },
});
