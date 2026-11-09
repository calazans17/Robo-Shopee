import { config } from "./config.js";
import { connectWhatsApp, sendTextToGroup, sendImageToGroup } from "./whatsapp.js";
import { fetchOffers } from "./shopeeClient.js";
import { formatOfferCaption, formatOffersMessage } from "./formatMessage.js";

const STABLE_MS = 8000;
const DELAY_BETWEEN_OFFERS_MS = 4000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
let currentSock = null;
let generation = 0;
let done = false;

function waitForStableConnection(sock, myGeneration) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!done && generation === myGeneration) resolve(sock);
    }, STABLE_MS);
  });
}

connectWhatsApp({
  onReady: async (sock) => {
    if (done) return;
    generation++;
    const myGeneration = generation;
    currentSock = sock;
    console.log(`[sendNow] Conectado (geracao ${myGeneration}). Aguardando estabilizar por ${STABLE_MS}ms...`);

    const stableSock = await waitForStableConnection(sock, myGeneration);
    if (!stableSock || done) return;

    console.log("[sendNow] Conexao estavel. Prosseguindo com o envio.");
    done = true;

    try {
      console.log("[sendNow] Buscando ofertas na Shopee...");
      const offers = await fetchOffers(config.offersPerDay);

      console.log("[sendNow] Verificando grupo...");
      const meta = await currentSock.groupMetadata(config.whatsapp.groupId);
      console.log(`[sendNow] Grupo confirmado: "${meta.subject}" (${meta.participants.length} participantes).`);

      if (!offers.length) {
        console.log("[sendNow] Nenhuma oferta encontrada, enviando aviso.");
        await sendTextToGroup(currentSock, config.whatsapp.groupId, formatOffersMessage(offers));
        process.exit(0);
      }

      console.log(`[sendNow] Enviando ${offers.length} oferta(s) para o grupo...`);
      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        const caption = formatOfferCaption(offer, i);
        const result = await sendImageToGroup(currentSock, config.whatsapp.groupId, offer.imageUrl, caption);
        console.log(`[sendNow] Oferta ${i + 1}/${offers.length} enviada:`, JSON.stringify(result));
        if (i < offers.length - 1) await delay(DELAY_BETWEEN_OFFERS_MS);
      }
      console.log("[sendNow] Todas as ofertas enviadas com sucesso.");
      process.exit(0);
    } catch (err) {
      console.error("[sendNow] Erro ao enviar:", err);
      process.exit(1);
    }
  },
});
