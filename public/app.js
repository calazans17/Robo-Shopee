const state = { items: [] };

const el = {
  status: document.getElementById("status"),
  limit: document.getElementById("limit"),
  fetchBtn: document.getElementById("fetchBtn"),
  fetchStatus: document.getElementById("fetchStatus"),
  offersList: document.getElementById("offersList"),
  sendBar: document.getElementById("sendBar"),
  sendBtn: document.getElementById("sendBtn"),
  sendCount: document.getElementById("sendCount"),
  sendStatus: document.getElementById("sendStatus"),
  log: document.getElementById("log"),
};

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

async function refreshStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();
    if (data.whatsapp === "connected") {
      el.status.textContent = data.groupName
        ? `Conectado ✓ — grupo "${data.groupName}"`
        : "Conectado ✓";
      el.status.className = "status status--ok";
    } else {
      el.status.textContent = "Conectando ao WhatsApp...";
      el.status.className = "status status--pending";
    }
  } catch {
    el.status.textContent = "Erro ao checar status do WhatsApp";
    el.status.className = "status status--error";
  }
}

function renderOffers() {
  el.offersList.innerHTML = "";
  state.items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = item.id;

    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${escapeHtml(item.productName || "")}" class="card__img" />
      <div class="card__body">
        <label class="card__include">
          <input type="checkbox" class="card__checkbox" checked />
          Incluir no envio
        </label>
        <textarea class="card__caption" rows="8">${escapeHtml(item.caption)}</textarea>
      </div>
    `;

    el.offersList.appendChild(card);
  });

  updateSendBar();
}

function updateSendBar() {
  const count = el.offersList.querySelectorAll(".card__checkbox:checked").length;
  el.sendCount.textContent = count;
  el.sendBar.hidden = state.items.length === 0;
  el.sendBtn.disabled = count === 0;
}

el.offersList.addEventListener("change", (e) => {
  if (e.target.classList.contains("card__checkbox")) updateSendBar();
});

el.fetchBtn.addEventListener("click", async () => {
  const limit = Number(el.limit.value) || 5;
  el.fetchBtn.disabled = true;
  el.fetchStatus.textContent = "Buscando ofertas na Shopee...";
  try {
    const res = await fetch(`/api/offers?limit=${limit}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao buscar ofertas");
    state.items = data.items;
    renderOffers();
    el.fetchStatus.textContent = `${data.items.length} oferta(s) carregada(s).`;
  } catch (err) {
    el.fetchStatus.textContent = `Erro: ${err.message}`;
  } finally {
    el.fetchBtn.disabled = false;
  }
});

el.sendBtn.addEventListener("click", async () => {
  const cards = [...el.offersList.querySelectorAll(".card")];
  const items = cards
    .filter((card) => card.querySelector(".card__checkbox").checked)
    .map((card) => {
      const id = card.dataset.id;
      const original = state.items.find((i) => i.id === id);
      return {
        id,
        imageUrl: original.imageUrl,
        caption: card.querySelector(".card__caption").value,
      };
    });

  if (!items.length) return;

  el.sendBtn.disabled = true;
  el.sendStatus.textContent = "Enviando...";
  el.log.hidden = false;
  el.log.textContent = "";

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro ao enviar");

    data.results.forEach((r, i) => {
      const line = r.ok
        ? `✅ Oferta ${i + 1} enviada com sucesso.`
        : `❌ Oferta ${i + 1} falhou: ${r.error}`;
      el.log.textContent += line + "\n";
    });

    const okCount = data.results.filter((r) => r.ok).length;
    el.sendStatus.textContent = `Concluído: ${okCount}/${data.results.length} enviada(s).`;
  } catch (err) {
    el.sendStatus.textContent = `Erro: ${err.message}`;
  } finally {
    el.sendBtn.disabled = false;
  }
});

refreshStatus();
setInterval(refreshStatus, 5000);
