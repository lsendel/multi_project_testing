# Interactive Knowledge Tree

An advanced web application providing an interactive, visual interface for managing and exploring knowledge documents in RAG (Retrieval-Augmented Generation) systems.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+
- Docker & Docker Compose (for development database)

### Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development services**
   ```bash
   # Start database services
   docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch
   
   # Start backend API server
   npm run dev --workspace=backend
   
   # Start frontend development server (in another terminal)
   npm run dev --workspace=frontend
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health check: http://localhost:3001/api/health

### Available Scripts

```bash
# Development
npm run dev              # Start frontend dev server
npm run dev:backend      # Start backend dev server

# Building
npm run build            # Build all packages
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Testing & Quality
npm run test             # Run tests in all packages
npm run lint             # Run ESLint on all packages
npm run type-check       # Run TypeScript checks
```

## 📁 Project Structure

```
interactive-knowledge-tree/
├── packages/
│   ├── frontend/          # React application
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── pages/         # Page components
│   │   │   ├── stores/        # Zustand state stores
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   └── services/      # API communication
│   │   └── tests/
│   ├── backend/           # Node.js API server
│   │   ├── src/
│   │   │   ├── routes/        # Express routes
│   │   │   ├── services/      # Business logic
│   │   │   └── models/        # Data models
│   │   └── tests/
│   └── shared/            # Shared types and utilities
│       ├── src/types/         # TypeScript definitions
│       └── src/utils/         # Helper functions
├── docker/                # Docker configurations
└── docs/                  # Project documentation
```

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Zustand** for state management
- **React Query** for server state
- **D3.js** for visualizations
- **Framer Motion** for animations

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** for primary database
- **Redis** for caching
- **Elasticsearch** for search

### Development Tools
- **ESLint** + **Prettier** for code quality
- **Vitest** for testing
- **Husky** for git hooks
- **Docker** for development environment

## 🎯 Features

### Phase 1: Foundation ✅
- [x] Monorepo setup with package management
- [x] TypeScript configuration
- [x] Basic React application with routing
- [x] Express API server
- [x] Database schema design
- [x] Development environment with Docker
- [x] CI/CD pipeline

### Phase 2: Core Tree Visualization (In Progress)
- [ ] Interactive tree component
- [ ] Node selection and expansion
- [ ] Visual hierarchy indicators
- [ ] Performance optimization with virtualization
- [ ] Minimap for large trees

### Phase 3: Search and Filtering (Planned)
- [ ] Full-text search with Elasticsearch
- [ ] Advanced filtering interface
- [ ] Search result highlighting
- [ ] Saved searches

### Phase 4: Context Management (Planned)
- [ ] Context inclusion/exclusion system
- [ ] Token usage tracking
- [ ] Smart context suggestions
- [ ] Context snapshots

### Phase 5: Advanced Features (Planned)
- [ ] Custom collections
- [ ] Document relationships
- [ ] Drag-and-drop organization
- [ ] Collaborative features

## 🔧 Development

### Database Management

```bash
# Start only database services
docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch

# View database logs
docker-compose -f docker-compose.dev.yml logs postgres

# Access PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U dev_user -d knowledge_tree
```

### Environment Variables

Create `.env` files in each package as needed:

**Backend (`packages/backend/.env`)**
```
NODE_ENV=development
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/knowledge_tree
REDIS_URL=redis://localhost:6379
ELASTICSEARCH_URL=http://localhost:9200
```

### Code Quality

The project uses automated code quality tools:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking
- **Husky** for pre-commit hooks

### Testing

```bash
# Run all tests
npm run test

# Run tests in specific package
npm run test --workspace=frontend
npm run test --workspace=backend

# Run tests in watch mode
npm run test -- --watch
```

## 📚 Documentation

- [Implementation Plan](./IMPLEMENTATION_PLAN.md) - Detailed project roadmap
- [API Documentation](./docs/api.md) - Backend API reference (TBD)
- [Component Library](./docs/components.md) - Frontend component docs (TBD)
- [Architecture Guide](./docs/architecture.md) - System architecture (TBD)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for better RAG system interfaces
- Community-driven development approach