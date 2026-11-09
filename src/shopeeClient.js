import crypto from "node:crypto";
import { config } from "./config.js";

// Assinatura exigida pela Shopee Open Platform (Affiliate API):
// Signature = SHA256(AppId + Timestamp + Payload + Secret)
// Header: Authorization: SHA256 Credential={appId}, Timestamp={timestamp}, Signature={signature}
function buildAuthHeader(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  const base = `${config.shopee.appId}${timestamp}${payload}${config.shopee.appSecret}`;
  const signature = crypto.createHash("sha256").update(base).digest("hex");
  const authorization = `SHA256 Credential=${config.shopee.appId}, Timestamp=${timestamp}, Signature=${signature}`;
  return authorization;
}

async function shopeeGraphQL(query, variables = {}) {
  const payload = JSON.stringify({ query, variables });
  const authorization = buildAuthHeader(payload);

  const res = await fetch(config.shopee.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
    },
    body: payload,
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Erro na API da Shopee: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// Busca ofertas de produtos. Os nomes dos campos seguem a API productOfferV2
// da Shopee Affiliate Open API - confira na documentacao oficial se algum
// campo mudou: https://open-api.affiliate.shopee.com.br/
export async function fetchOffers(limit = 5) {
  const query = `
    query productOfferV2($keyword: String, $limit: Int) {
      productOfferV2(keyword: $keyword, limit: $limit, page: 1, sortType: 2) {
        nodes {
          productName
          priceMin
          priceMax
          commissionRate
          sales
          imageUrl
          offerLink
        }
      }
    }
  `;

  const variables = {
    keyword: config.shopee.keyword || null,
    limit,
  };

  const data = await shopeeGraphQL(query, variables);
  return data?.productOfferV2?.nodes || [];
}
