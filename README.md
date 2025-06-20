# Controle de Fiado

Sistema para pequenos comerciantes controlarem as vendas fiado dos seus clientes.

## Características

- Gestão de clientes
- Controle de produtos e estoque
- Registro de vendas fiado
- Relatórios e dashboards
- Interface intuitiva e amigável

## Tecnologias utilizadas

- **Backend:** Flask (Python), SQLite
- **Frontend:** React, TypeScript, CSS

## Requisitos

- Python 3.6+
- Node.js 14+
- NPM ou Yarn

## Instalação

1. Clone este repositório
2. Configure o ambiente backend:

```bash
# Instalar dependências Python
pip install -r requirements.txt
```

3. Configure o ambiente frontend:

```bash
# Entrar na pasta frontend
cd frontend

# Instalar dependências
npm install
```

## Executando o projeto

### Iniciar o backend e frontend separadamente

**Backend:**

```bash
python app.py
```

O servidor será iniciado em http://localhost:5000

**Frontend:**

```bash
cd frontend
npm start
```

O frontend será iniciado em http://localhost:3000

## Estrutura do Projeto

```
fiado-app/
  ├── app.py             # Backend Flask
  ├── extensions.py      # Extensões do Flask
  ├── models.py          # Modelos de dados
  ├── schemas.py         # Schemas para validação de dados
  ├── requirements.txt   # Dependências Python
  ├── instance/          # Banco de dados SQLite
  │
  └── frontend/          # Aplicação React
      ├── src/
      │   ├── components/   # Componentes reutilizáveis
      │   ├── pages/        # Páginas principais
      │   ├── services/     # Conexão com a API
      │   └── types/        # Definições de tipos TypeScript
      └── public/
```

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir um issue ou enviar um pull request. 