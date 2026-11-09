const CATCHY_DESCRIPTIONS = [
  "Um achadinho e tanto pra você aproveitar hoje! 😍",
  "Esse aqui tá bombando nas vendas, olha só! 🔥",
  "Virou queridinho da galera, corre que é sucesso! 💫",
  "Praticidade e estilo por um precinho camarada! ✨",
  "Esse item é indispensável no dia a dia! 🙌",
];

const APPEAL_LINES = [
  "Aproveita que o preço tá baixo!",
  "Perfeito pra economizar hoje!",
  "Oferta imperdível, corre antes que acabe!",
  "Vale muito a pena aproveitar essa!",
  "Preço bom assim não dura muito!",
];

function formatPrice(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return value;
  return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Legenda no padrão de post de afiliado: título, chamada, link, preço em
// destaque e call to action. Usada em conjunto com a imagem do produto.
export function formatOfferCaption(offer, index = 0) {
  const price = formatPrice(offer.priceMin);
  const description = CATCHY_DESCRIPTIONS[index % CATCHY_DESCRIPTIONS.length];
  const appeal = APPEAL_LINES[index % APPEAL_LINES.length];

  return [
    `*${offer.productName}*`,
    description,
    "",
    offer.offerLink,
    "",
    `🔥 Por apenas *${price}*`,
    `✨ ${appeal}`,
    `👉 Corre conferir!`,
  ].join("\n");
}

export function formatOffersMessage(offers) {
  if (!offers.length) {
    return "Nenhuma oferta encontrada hoje. 😕";
  }

  const header = "🔥 *Achadinhos do dia* 🔥\n";
  const lines = offers.map((offer, index) => {
    const price = formatPrice(offer.priceMin);
    const commission = offer.commissionRate
      ? ` (comissão ${(Number(offer.commissionRate) * 100).toFixed(0)}%)`
      : "";
    return [
      `${index + 1}. *${offer.productName}*`,
      `💰 ${price}${commission}`,
      `🔗 ${offer.offerLink}`,
    ].join("\n");
  });

  return [header, ...lines].join("\n\n");
}
