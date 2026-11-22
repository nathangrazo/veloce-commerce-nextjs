# Veloce Commerce

[![CI](https://github.com/nathangrazo/veloce-commerce-nextjs/actions/workflows/ci.yml/badge.svg)](https://github.com/nathangrazo/veloce-commerce-nextjs/actions/workflows/ci.yml)

E-commerce full-stack feito com Next.js 16 (App Router), React 19, TypeScript e Tailwind CSS 4.

Comecei como uma versão web de uma loja que eu tinha feito em React Native com Context API, e acabou virando um estudo de até onde dá pra ir só com o estado nativo do React (`Context` + `useReducer` + `useSyncExternalStore`) junto com Route Handlers do Next, sem Redux/Zustand.

| Tema claro | Tema escuro + carrinho |
| :---: | :---: |
| ![Vitrine tema claro](docs/screenshots/storefront-light.png) | ![Vitrine tema escuro](docs/screenshots/storefront-dark.png) |

## Funcionalidades

- **Vitrine** (`/`): filtro por categoria, busca, ordenação e lista de vistos recentemente
- **Produto** (`/products/[slug]`): páginas geradas estaticamente com `generateStaticParams`
- **Carrinho** (drawer + `/cart`): updates otimistas, barra de frete grátis (acima de $250) e cupons
- **Login** (`/login`): cookie de sessão HTTP-only assinado; o carrinho de visitante é mesclado ao logar
- **Checkout e pedidos** (`/checkout`, `/orders`): formulário validado com Zod e preço recalculado no servidor
- **Configurações** (`/settings`): tema light/dark/system, perfil de entrega e reset dos dados da conta

## Algumas decisões

**Contextos separados no carrinho.** Estado (`CartStateContext`) e ações (`CartActionsContext`) ficam em contextos diferentes. O `ProductCard` só usa as ações, então adicionar um item não re-renderiza a grid inteira.

**Fila de mutações otimistas.** A primeira versão fazia o clássico: snapshot antes do request e rollback no `catch`. Isso quebra quando duas ações se sobrepõem e a primeira falha depois da segunda dar certo (o rollback apaga a segunda). Agora as mutações passam por uma fila FIFO com um contador de revisão, e só reconcilio com `GET /api/cart` quando a fila esvazia. Tem teste cobrindo esse caso em `CartContext.test.tsx`.

**`useSyncExternalStore` pra tema e vistos recentemente.** Evita `setState` dentro de `useEffect` e os warnings de hydration.

**Sessão assinada.** Cookie com HMAC-SHA256 (`timingSafeEqual`) e TTL de 7 dias checado no servidor. Em produção a app não sobe sem `SESSION_SECRET`.

**Preço calculado no servidor.** O preview do carrinho e o `POST /api/orders` usam a mesma função pura (`src/domain/pricing.ts`). O cliente nunca manda preço pra API.

**Persistência plugável.** Com as variáveis do Upstash configuradas usa Redis via REST; sem elas, cai num JSON local (`./data/store.json`) com mutex, o que facilita rodar sem setup nenhum.

Mais detalhes em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Limitações

É um projeto de estudo, não uma loja de verdade:

- Só existe um usuário demo fixo. Num cenário real teria tabela de usuários com hash (Argon2/bcrypt) ou OAuth.
- O JSON local não escala com mais de um processo. Na Vercel use o Upstash; pra estoque de verdade eu iria de Postgres.
- Não tem gateway de pagamento, o checkout só grava o pedido.
- O catálogo é estático em `src/server/data/products.ts`.

## Conta demo e cupons

| | |
| :--- | :--- |
| Email | `demo@veloce.store` |
| Senha | `veloce123` |
| 10% de desconto | `WELCOME10` |
| Frete grátis | `FREESHIP` |

## Rodando localmente

Node 20+.

```bash
git clone https://github.com/nathangrazo/veloce-commerce-nextjs.git
cd veloce-commerce-nextjs
npm install
cp .env.example .env.local
npm run dev
```

| Script | |
| :--- | :--- |
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | testes unitários e de rotas (Vitest) |
| `npm run test:e2e` | teste E2E do checkout (Playwright) |

## Deploy na Vercel

1. Importe o repositório na Vercel
2. Adicione um `SESSION_SECRET` aleatório (mínimo 16 caracteres)
3. Conecte a integração do Upstash Redis pra que carrinho e pedidos persistam entre as instâncias serverless
4. Deploy

## Estrutura

```text
src/
├── app/         # páginas e route handlers
├── components/  # UI base e layout
├── contexts/    # Theme, Toast, Auth, Cart, RecentlyViewed
├── domain/      # tipos, schemas Zod e regras de preço
├── features/    # telas por domínio
├── lib/         # helpers
├── server/      # catálogo, sessão e drivers de persistência
└── services/    # wrappers de fetch tipados
```

## Licença

MIT
