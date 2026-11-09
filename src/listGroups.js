import { connectWhatsApp } from "./whatsapp.js";

connectWhatsApp({
  onReady: async (sock) => {
    const groups = await sock.groupFetchAllParticipating();
    console.log("\nGrupos encontrados:\n");
    for (const group of Object.values(groups)) {
      console.log(`- ${group.subject}  =>  ${group.id}`);
    }
    console.log("\nCopie o ID do grupo de achadinhos e cole em WHATSAPP_GROUP_ID no .env");
    process.exit(0);
  },
});
