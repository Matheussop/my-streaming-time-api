# My Streaming Time API

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![License](https://img.shields.io/badge/license-ISC-green.svg)

A RESTful API for streaming history management, allowing users to track watched movies, viewing time, and content categorization.

## 📑 Table of Contents
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Development](#development)
- [Contributing](#contributing)

## 🚀 Features

- Movie management with TMDB integration
- User streaming history tracking
- Streaming type categorization
- User management
- Swagger documentation
- Error handling and logging

## ⚙️ Requirements

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- TMDB API Key (instructions at: https://developer.themoviedb.org/docs/getting-started)

## 🔧 Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory with the following variables:
     ```
     MONGO_URI=your_mongodb_connection_string
     TMDB_Bearer_Token=your_tmdb_api_token
     NODE_ENV=development
     PORT=5000
     ```

4. Run the application:
   Development:
   ```bash
   npm run dev
   ```
   Production:
   ```bash
   npm run build
   npm run start
   ```

5. Project Structure
```bash
src/
├── config/          # Configuration files and environment setup
├── controllers/     # Request handlers and response formatting
├── interfaces/      # TypeScript interfaces and type definitions
├── middleware/      # Express middleware (auth, validation, error handling)
├── models/          # Database models and schemas
├── repositories/    # Data access layer for database operations
├── routes/          # API route definitions
├── services/        # Business logic and external API integration
├── util/           # Helper functions and shared utilities
└── server.ts       # Main application entry point
```

## 📚 API Documentation

The API documentation is available via Swagger UI at `/api-docs` when the server is running.

### Authentication

Example request using curl:
```bash
curl -X POST http://localhost:5000/user/login \
-H "Content-Type: application/json" \
-d '{"email": "test@test.com", "password": "test"}'
```

### Main Endpoints

- `/movies` - Movie management
- `/series` - Series management
- `/streamingTypes` - Streaming type management
- `/user` - User management
- `/user-streaming-history` - User streaming history
  
## 🏗️ Architecture

The project follows the Repository Pattern with the following structure:

- `controllers/`: Request and response handling
- `services/`: Business logic
- `repositories/`: Data access
- `models/`: Schemas and interfaces
- `middleware/`: Request interceptors

  
### Movie Management
- CRUD operations for movies
- Integration with TMDB API
- Search by title and genre
- Validation for movie data

### Series Management
- CRUD operation for series
- Integration with TMDB api
- Search by title and genre
- Validation to add genre

### Streaming Types
- Streaming type management (movies or series)
- Add/remove streaming type
- Validation for duplicate types

### User Streaming History
- ... in progress

### Genre Management
- CRUD operation for series
- ... in progress

### Error Handling
- Centralized error handling
- Custom error classes
- Validation error handling
- MongoDB error handling

## Models
  
### Movie
- _id
- title
- plot
- release_date
- cast
- rating
- genre
- status
- poster
- url
- tmdbId
- durationInMinutes
- createdAt
- updatedAt

### Series
- _id
- title
- plot
- release_date
- cast
- rating
- genre
- status
- poster
- url
- tmdbId
- totalSeasons
- totalEpisodes
- seasonsSummary
- createdAt
- updatedAt

### Season
- _id
- seriesId
- seasonNumber
- title
- plot
- releaseDate
- poster
- episodes
- createdAt
- updatedAt

### Episode
- _id
- episodeNumber
- title
- plot
- durationInMinutes
- releaseDate
- poster
  
### User
- _id
- email
- username
- password
- passwordChangedAt
- passwordResetToken
- passwordResetExpires
- active
- verified
- verificationToken
- role
- profile
- preferences
- stats
- watchList
- createdAt
- updatedAt

### Genre
- _id
- name
- description
- isActive
- createdAt
- updatedAt

### Streaming History
- _id
- userId
- watchHistory
- totalWatchTimeInMinutes
- createdAt
- updatedAt

### Streaming Types
- _id
- name
- description
- supportedGenres
- isActive
- createdAt
- updatedAt

### Code Standards
- ESLint for linting
- Conventional Commits for commit messages
- SOLID principles

### Testing
```bash
npm run test
npm run test:coverage
```

## 🧪 Debugging Tests

You can use the following command to help detect open handles or memory leaks during test execution:

```bash
npm run test:debug
```

## 📦 Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

Current version: 1.3.1

For detailed release notes and version history, please see our [CHANGELOG.md](CHANGELOG.md).
For detailed architecture ideas and notes, please see our [ARCHITECTURE.md](ARCHITECTURE.md).


## 🤖 GitHub Workflows

A weekly scheduled GitHub Action was added to automatically trigger cover image updates for streaming types.

- **Schedule:** Every Sunday at 12:00 UTC
- **Steps:**
  - Wake up Render server using `/health` endpoint
  - Trigger `/streamingTypes/change-cover`

You can find the workflow in `.github/workflows/cron.yaml`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## 📄 License

ISC

## ✨ Author

Matheus Spindula

## 🚀 Deploy em Produção

> **Nota:** A URL de produção não está listada publicamente para evitar uso indevido, já que este é um projeto aberto. Para rodar localmente ou em produção, siga as instruções abaixo e utilize sua própria instância da API.

Você pode consumir todos os endpoints REST a partir da URL configurada no seu ambiente de deploy.

### Como rodar o frontend localmente usando a API de produção

No seu frontend, aponte as requisições para a URL da sua instância da API.  
Exemplo de configuração de ambiente no frontend:
```
REACT_APP_API_URL=https://sua-api-no-render-ou-outro-servico.com
```

### Documentação da API em produção

Acesse a documentação Swagger em:  
`/api-docs` na URL da sua instância da API.

---

## 🔒 Dicas para Produção

- Nunca suba seu `.env` real para o repositório.
- No MongoDB Atlas, restrinja o acesso ao IP do Render.
- Monitore os logs pelo painel do Render.
- Use variáveis de ambiente seguras no Render.

---

## 🌎 Exemplo de `.env.example` para produção

```env
MONGO_URI=your_mongodb_atlas_connection_string
TMDB_Bearer_Token=your_tmdb_api_token
NODE_ENV=production
PORT=3000
```

---

## 🛠️ Como atualizar o deploy

1. Faça push para a branch principal do seu repositório.
2. O Render fará o deploy automaticamente.
3. Acompanhe os logs pelo painel do Render.

