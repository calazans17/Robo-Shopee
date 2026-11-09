import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.warn(`[config] Aviso: variavel ${name} nao esta definida no .env`);
  }
  return value;
}

export const config = {
  shopee: {
    appId: required("SHOPEE_APP_ID"),
    appSecret: required("SHOPEE_APP_SECRET"),
    apiUrl: process.env.SHOPEE_API_URL || "https://open-api.affiliate.shopee.com.br/graphql",
    keyword: process.env.SHOPEE_KEYWORD || "",
  },
  whatsapp: {
    groupId: required("WHATSAPP_GROUP_ID"),
  },
  scheduleCron: process.env.SCHEDULE_CRON || "0 9 * * *",
  offersPerDay: Number(process.env.OFFERS_PER_DAY || 5),
};
