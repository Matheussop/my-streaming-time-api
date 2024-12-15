# My Streaming Time API

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
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
- Search by title
- Validation for movie data

### Streaming Types
- Category management
- Add/remove categories
- Validation for duplicate names

### User Streaming History
- Track watch history
- Calculate total watch time
- Add/remove streaming entries

### Error Handling
- Centralized error handling
- Custom error classes
- Validation error handling
- MongoDB error handling

## Models

### Movie
- Title
- Release date
- Plot
- Cast
- Rating
- Genre
- URL

### User
- Name
- Email
- Password (hashed)
- Timestamps

### Streaming History
- User ID
- Watch history
- Total watch time
- Timestamps

### Streaming Types
- Name
- Categories
- Timestamps


### Code Standards
- ESLint for linting
- Conventional Commits for commit messages
- SOLID principles

### Testing
```bash
npm run test
npm run test:coverage
```

## 📦 Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

Current version: 1.0.0

For detailed release notes and version history, please see our [CHANGELOG.md](CHANGELOG.md).

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

