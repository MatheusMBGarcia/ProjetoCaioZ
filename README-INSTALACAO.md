# ToolStock - instalação

## 1. Frontend

Na raiz do projeto:

```powershell
npm.cmd install
npm.cmd run dev
```

Abra a URL que o Vite mostrar, normalmente `http://localhost:5173/`.

## 2. Backend

Entre em `backend`:

```powershell
npm.cmd install
node server.js
```

O backend deve mostrar:

```text
🚀 API rodando em http://localhost:3001
```

## 3. Banco

Mantenha o seu `backend/.env` atual. Não substitua esse arquivo pelo `.env.example` sem preencher as credenciais.

O `server.js` cria as tabelas de apoio que estiverem faltando. O arquivo `backend/database.sql` também contém a estrutura mínima.

## 4. Login inicial

Se a tabela `usuarios` estiver vazia, o backend cria:

- E-mail: `admin@estoque.local`
- Senha: `1234`
- Perfil: `ADMIN`

## 5. Fluxo

```text
React/Vite :5173
    ↓
Express :3001
    ↓
MySQL
```

Produtos, categorias, fornecedores, usuários e movimentações usam a API real. Entradas e saídas atualizam o estoque dentro de uma transação e registram o histórico em `movimentacoes`.
