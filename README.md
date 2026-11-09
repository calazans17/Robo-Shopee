<div align="center">

# 🛍️ Robô Shopee — Achadinhos no WhatsApp

**Automação que busca as melhores ofertas na API de Afiliados da Shopee e publica todo dia, sozinha, em um grupo de WhatsApp — com link de afiliado, imagem do produto e legenda pronta para vender.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![GraphQL](https://img.shields.io/badge/GraphQL-Shopee%20Affiliate%20API-E10098?logo=graphql&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-25D366?logo=whatsapp&logoColor=white)
![PM2](https://img.shields.io/badge/Deploy-PM2%20%2F%20VPS-2B037A?logo=pm2&logoColor=white)

</div>

---

## 📌 Sobre o projeto

Quem trabalha com marketing de afiliados passa horas procurando produtos, copiando links, baixando imagens e escrevendo legendas. Este robô faz tudo isso automaticamente:

1. **Consulta** a API GraphQL de Afiliados da Shopee, com autenticação por assinatura SHA-256;
2. **Seleciona** os produtos mais vendidos (opcionalmente filtrados por palavra-chave);
3. **Monta** uma legenda com título, chamada, preço formatado em R$ e link de afiliado;
4. **Envia** cada oferta com a foto do produto para o grupo de WhatsApp, no horário agendado.

Também tem um **painel web** onde dá para revisar e editar as ofertas antes de mandar, para quem prefere ter controle manual.

## ✨ Funcionalidades

| | Funcionalidade | Detalhe |
|---|---|---|
| ⏰ | **Envio agendado** | Expressão cron configurável, no fuso `America/Sao_Paulo` |
| 🔐 | **Integração autenticada** | Cliente GraphQL com header `SHA256 Credential/Timestamp/Signature` exigido pela Shopee |
| 🖼️ | **Mensagens com imagem** | Cada oferta vai como foto + legenda formatada em Markdown do WhatsApp |
| 🖥️ | **Painel web** | Buscar, editar legenda, desmarcar e enviar as ofertas em lote pelo navegador |
| 🔄 | **Reconexão resiliente** | Reconecta sozinho quando o WhatsApp cai, sem duplicar o agendamento |
| ⏱️ | **Envio espaçado** | Intervalo entre mensagens para evitar bloqueio por spam |
| 🧪 | **Modo de teste** | Mostra no terminal como ficariam as mensagens, sem enviar nada |
| 🚀 | **Pronto para produção** | Roda 24/7 em VPS com PM2 |

## 🏗️ Arquitetura

```mermaid
flowchart LR
    A[⏰ node-cron<br/>agendador] --> B[shopeeClient<br/>GraphQL + SHA-256]
    P[🖥️ Painel web<br/>Express] --> B
    B -->|productOfferV2| S[(API de Afiliados<br/>Shopee)]
    S --> B
    B --> F[formatMessage<br/>legenda + preço R$]
    F --> W[whatsapp<br/>Baileys]
    W -->|imagem + legenda| G[📱 Grupo de<br/>WhatsApp]
```

### Estrutura de pastas

```
├── index.js               # Robô principal: conecta no WhatsApp e agenda o envio diário
├── public/                # Front-end do painel (HTML, CSS e JS puro)
└── src/
    ├── config.js          # Leitura e validação das variáveis de ambiente
    ├── shopeeClient.js    # Cliente GraphQL da Shopee com assinatura SHA-256
    ├── formatMessage.js   # Gera legendas de afiliado e formata preços em BRL
    ├── whatsapp.js        # Conexão via Baileys, QR code, reconexão e envio
    ├── webServer.js       # API REST (Express) que alimenta o painel
    ├── sendNow.js         # Envio imediato, sem esperar o agendamento
    ├── whatsappLogin.js   # Login por QR code
    ├── listGroups.js      # Lista os grupos da conta e seus IDs
    └── testShopee.js      # Testa a API sem enviar nada
```

## 🛠️ Tecnologias

- **Node.js** (ES Modules, `fetch` nativo, `crypto`)
- **[Baileys](https://github.com/WhiskeySockets/Baileys)**: cliente WhatsApp Web via WebSocket
- **Express**: API REST do painel
- **node-cron**: agendamento das publicações
- **GraphQL**: consumo da Shopee Affiliate Open API
- **pino** e **dotenv**: logs e configuração
- **PM2**: gerenciamento do processo em produção

## 🚀 Como rodar

### Pré-requisitos

- Node.js 18 ou superior
- Conta de afiliado na [Shopee Affiliate Open Platform](https://open-api.affiliate.shopee.com.br/), com App ID e App Secret
- Um número de WhatsApp para o robô

### 1. Instalar

```bash
git clone https://github.com/calazans17/Robo-Shopee.git
cd Robo-Shopee
npm install
```

### 2. Configurar

```bash
cp .env.example .env
```

| Variável | Descrição | Exemplo |
|---|---|---|
| `SHOPEE_APP_ID` | App ID do painel de afiliado | `123456` |
| `SHOPEE_APP_SECRET` | App Secret do painel de afiliado | `xxxxxxxx` |
| `SHOPEE_API_URL` | Endpoint GraphQL | `https://open-api.affiliate.shopee.com.br/graphql` |
| `WHATSAPP_GROUP_ID` | ID do grupo de destino | `123456789-123456789@g.us` |
| `SCHEDULE_CRON` | Horário diário de envio (cron) | `0 9 * * *` (todo dia às 9h) |
| `OFFERS_PER_DAY` | Quantas ofertas mandar por dia | `5` |
| `SHOPEE_KEYWORD` | Filtro por palavra-chave (opcional) | `cozinha` |

### 3. Conectar o WhatsApp

```bash
npm run login
```

Escaneie o QR code em **WhatsApp › Aparelhos conectados › Conectar um aparelho**. A sessão fica salva localmente e não precisa ser refeita.

### 4. Descobrir o ID do grupo

```bash
npm run list-groups
```

Copie o ID do grupo desejado para `WHATSAPP_GROUP_ID` no `.env`.

### 5. Testar e rodar

```bash
npm run test-shopee      # mostra as ofertas no terminal, sem enviar
npm start                # robô automático, envia no horário do SCHEDULE_CRON
npm run send-now         # envia as ofertas agora mesmo
npm run web              # painel em http://localhost:3000
```

## 🖥️ Painel web

Em `http://localhost:3000` o painel:

- mostra se o WhatsApp está conectado e para qual grupo vai o envio;
- busca as ofertas da Shopee na quantidade escolhida;
- deixa **editar a legenda** de cada oferta e **desmarcar** as que não interessam;
- envia todas as selecionadas de uma vez, com o mesmo intervalo do robô automático.

## ☁️ Rodando 24/7 em produção

```bash
npm install -g pm2
pm2 start index.js --name robo-shopee
pm2 save
pm2 startup
```

O robô continua rodando mesmo depois que o servidor reinicia.

## 💡 Desafios técnicos resolvidos

- **Autenticação da Shopee:** a API exige uma assinatura `SHA256(AppId + Timestamp + Payload + Secret)` gerada a cada requisição. Ela foi implementada com o módulo nativo `crypto`, sem depender de SDK.
- **Agendamento duplicado:** o evento de "conexão pronta" do WhatsApp dispara de novo a cada reconexão. O robô guarda sempre o socket mais recente e registra o cron uma única vez, então o grupo nunca recebe a mesma oferta repetida.
- **Conexão instável logo após conectar:** os envios só começam depois de uma janela de estabilização, e um contador de "geração" descarta conexões antigas.
- **Envio em grupos:** a API oficial do WhatsApp Business não envia mensagens para grupos, por isso o projeto usa o protocolo do WhatsApp Web via Baileys.

## ⚠️ Aviso

Este é um projeto pessoal e educacional. O envio usa o WhatsApp Web de forma não oficial, então use com moderação e respeite os termos de uso do WhatsApp e da Shopee. Credenciais (`.env`) e a sessão do WhatsApp (`auth_baileys/`) ficam fora do repositório.

---

<div align="center">

Desenvolvido por **[Pedro Augusto Alves Oliveira Calazans](https://github.com/calazans17)**

</div>
