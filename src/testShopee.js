import { fetchOffers } from "./shopeeClient.js";
import { formatOffersMessage } from "./formatMessage.js";
import { config } from "./config.js";

const offers = await fetchOffers(config.offersPerDay);
console.log(formatOffersMessage(offers));
