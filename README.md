# Sistema de Controle de Fiado

Um sistema simples e eficiente para pequenos comerciantes controlarem vendas fiado.

## Funcionalidades

- **Dashboard**: Visualização rápida de valores pendentes e clientes com fiado
- **Controle de Fiado**: Registro de valores fiado por cliente
- **Gerenciamento de Clientes**: Cadastro e edição de clientes com campo de referência para fácil identificação
- **Relatórios**: Acompanhamento de vendas e pagamentos

## Tecnologias

- **Backend**: Python com Flask
- **Frontend**: React com TypeScript
- **Banco de Dados**: SQLite (para facilitar a instalação e deploy do MVP)

## Como Iniciar

### Requisitos

- Python 3.6+
- Node.js 14+
- npm ou yarn

### Backend

```bash
# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor
python app.py
```

### Frontend

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Iniciar o servidor de desenvolvimento
npm start
```

## Deploy (MVP)

### Backend (Flask + SQLite no Rancher)

1. Gere a imagem Docker:
   ```sh
   docker build -t fiado-backend:latest .
   ```
2. Suba a imagem no Rancher (ou Docker Hub, se preferir):
   - Use a porta 5000.
   - Não precisa de volume se não se importar em perder os dados ao reiniciar (MVP).
   - Se quiser persistência, monte um volume em `/app/app.db`.

### Frontend (React no Netlify)

1. Faça o build do frontend:
   ```sh
   cd frontend
   npm install
   npm run build
   ```
2. No Netlify:
   - Configure o build command: `npm run build`
   - Configure o publish directory: `frontend/build`
   - Configure a variável de ambiente `REACT_APP_API_URL` com o endereço do backend Flask.

### Observações
- O SQLite funciona dentro do container para MVP, mas não é recomendado para produção real.
- O frontend se comunica com o backend via variável de ambiente.

## Estrutura do Projeto

- `/app.py` - Aplicação Flask principal
- `/models.py` - Modelos de dados
- `/schemas.py` - Schemas para validação
- `/frontend/` - Aplicação React

## Uso

1. Acesse o Dashboard para visualizar um resumo dos valores pendentes
2. Na tela de Controle de Fiado, registre novos valores fiado
3. Adicione clientes com referências para facilitar a identificação
4. Marque como pago quando o cliente quitar sua dívida

## Licença

Este projeto é licenciado sob a licença MIT.