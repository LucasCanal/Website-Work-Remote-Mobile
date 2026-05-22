# Snap Remote

Dashboard SaaS multiusuário para gestão de tarefas, eventos e equipes remotas.

## Tecnologias

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Banco de dados:** MongoDB Atlas
- **Autenticação:** JWT + bcrypt

## Como rodar

1. Clone o repositório e instale as dependências:
```bash
npm install
```

2. Crie um arquivo `.env` na raiz:
```env
MONGODB_URI=sua_string_de_conexao
JWT_SECRET=sua_chave_secreta
```

3. Inicie o servidor:
```bash
node server.js
```

4. Acesse `http://localhost:3000` no navegador.

## Funcionalidades

- Cadastro e login com autenticação real
- Dados isolados por usuário (cada conta vê apenas os seus dados)
- Todo List com kanban e drag & drop
- Calendário, lembretes e métricas
- Gerenciamento de equipe
- Pomodoro Timer integrado
- Dark/Light mode por usuário

## Licença

MIT
