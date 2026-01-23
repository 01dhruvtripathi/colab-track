# Contributing to Colab Track

Thank you for your interest in contributing to Colab Track! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/colab-track.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Open a Pull Request

## Development Setup

### Backend Setup
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
1. Install PostgreSQL
2. Create database: `createdb colabtrack`
3. Run schema: `psql colabtrack < database/schema.sql`

## Code Style

- Follow Java coding conventions for backend code
- Use ESLint/Prettier for frontend JavaScript
- Write meaningful commit messages
- Add comments for complex logic

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Add integration tests for API endpoints

## Pull Request Process

1. Update README.md if needed
2. Update CHANGELOG.md with your changes
3. Ensure all tests pass
4. Request review from maintainers

## Questions?

Open an issue for any questions or concerns.


