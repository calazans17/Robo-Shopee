import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./config.js";
import { connectWhatsApp, sendImageToGroup } from "./whatsapp.js";
import { fetchOffers } from "./shopeeClient.js";
import { formatOfferCaption } from "./formatMessage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const DELAY_BETWEEN_OFFERS_MS = 4000;
const STABLE_MS = 8000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let sock = null;
let whatsappStatus = "connecting";
let groupName = null;

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/status", (req, res) => {
  res.json({ whatsapp: whatsappStatus, groupName, groupId: config.whatsapp.groupId });
});

app.get("/api/offers", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || config.offersPerDay;
    const offers = await fetchOffers(limit);
    const items = offers.map((offer, index) => ({
      id: `${Date.now()}-${index}`,
      productName: offer.productName,
      imageUrl: offer.imageUrl,
      priceMin: offer.priceMin,
      offerLink: offer.offerLink,
      caption: formatOfferCaption(offer, index),
    }));
    res.json({ items });
  } catch (err) {
    console.error("[web] Erro ao buscar ofertas:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/send", async (req, res) => {
  if (!sock || whatsappStatus !== "connected") {
    return res.status(409).json({ error: "WhatsApp ainda nao esta conectado." });
  }

  const { items } = req.body;
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Nenhum item para enviar." });
  }

  const results = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    try {
      await sendImageToGroup(sock, config.whatsapp.groupId, item.imageUrl, item.caption);
      results.push({ id: item.id, ok: true });
      console.log(`[web] Item ${i + 1}/${items.length} enviado.`);
    } catch (err) {
      console.error(`[web] Erro ao enviar item ${i + 1}:`, err);
      results.push({ id: item.id, ok: false, error: err.message });
    }
    if (i < items.length - 1) await delay(DELAY_BETWEEN_OFFERS_MS);
  }

  res.json({ results });
});

let readyGeneration = 0;

connectWhatsApp({
  onReady: async (readySock) => {
    readyGeneration++;
    const myGeneration = readyGeneration;
    whatsappStatus = "connecting";

    // Espera estabilizar (mesmo cuidado do sendNow.js) antes de considerar a
    // sessao pronta para uso, evitando falhas logo apos um reconnect.
    await delay(STABLE_MS);
    if (myGeneration !== readyGeneration) return;

    sock = readySock;
    whatsappStatus = "connected";
    try {
      const meta = await sock.groupMetadata(config.whatsapp.groupId);
      groupName = meta.subject;
    } catch (err) {
      groupName = null;
      console.warn("[web] Nao foi possivel confirmar o grupo:", err.message);
    }
    console.log("[web] WhatsApp pronto.");
  },
});

app.listen(PORT, () => {
  console.log(`[web] Painel disponivel em http://localhost:${PORT}`);
});
