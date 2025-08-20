# 📋 NPM Scripts Documentation

## 🏗️ **Build & Compilation**

- **`npm run build`** - Development build with source maps for debugging
- **`npm run build:prod`** - Production build without source maps (smaller bundle)
- **`npm run clean`** - Delete dist/ folder for fresh builds

## 🚀 **Server Startup**

- **`npm start`** - Run production server (compiled JavaScript)
- **`npm run start:staging`** - Run staging server
- **`npm run start:dev`** or **`npm run dev`** - Development server with hot reload

## 🔍 **Code Quality**

- **`npm run type-check`** - Validate TypeScript types (fast, no compilation)
- **`npm run lint`** - Check for code issues and security problems
- **`npm run lint:fix`** - Auto-fix linting issues
- **`npm run format`** - Format all files with Prettier
- **`npm run format:check`** - Check formatting without changing files
- **`npm run lint:staged`** - Lint only staged files (pre-commit hook)

## 🔧 **Other**

- **`npm test`** - Run test suite (placeholder)
- **`npm run prepare`** - Setup Git hooks (auto-runs after install)
- **`npm run heroku-postbuild`** - Heroku deployment build
- **`npm run docker:build`** - Build Docker image
- **`npm run docker:run`** - Run Docker container locally

## 🔄 **Common Workflows**

**Development:**

```bash
npm run dev          # Start development
npm run lint:fix     # Fix issues
npm run format       # Format code
```

**Production:**

```bash
npm run build:prod   # Build for production
npm start           # Run production server
```

```

```
