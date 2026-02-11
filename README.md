# Debit System – Frontend

Frontend em **React** (Vite) que consome a API do [Debit System](../debit-system) (Laravel).

## Stack

- **React 19** + **Vite 7**
- **React Router** – rotas e navegação
- **Axios** – chamadas à API (com interceptor para token e 401)
- **Tailwind CSS v4** – estilos

## Pré-requisitos

- Node.js 18+
- Backend Laravel rodando (ex.: `php artisan serve` em `http://localhost:8000`)

## Instalação

```bash
npm install
```

## Variáveis de ambiente

Copie o exemplo e ajuste se precisar:

```bash
cp .env.example .env
```

- `VITE_API_URL`: URL base da API. Em desenvolvimento o Vite faz proxy de `/api` para `http://localhost:8000`, então pode deixar em branco ou usar `http://localhost:8000/api`.

## Desenvolvimento

Com o **backend** rodando na porta 8000:

```bash
npm run dev
```

Acesse: **http://localhost:5173**

- **Login:** use as credenciais do backend (ex.: `test@example.com` / `password123`).
- Após login você cai no Dashboard; as telas de clientes e promissórias podem ser adicionadas depois.

## Build

```bash
npm run build
```

Arquivos de produção em `dist/`. Para servir:

```bash
npm run preview
```

## Estrutura inicial

- `src/lib/api.js` – cliente Axios (baseURL, token, tratamento de 401)
- `src/contexts/AuthContext.jsx` – estado de autenticação (login/logout, user)
- `src/pages/Login.jsx` – tela de login
- `src/pages/Dashboard.jsx` – tela inicial após login
- `src/components/ProtectedRoute.jsx` – rota que exige autenticação

## Próximos passos

- Páginas de listagem e formulário de **Clientes**
- Páginas de **Promissórias** (listagem, criar, marcar como paga, pagamento parcial, etc.)
- Layout com menu de navegação
