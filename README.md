# LessJS Framework

A modern, secure, and scalable Node.js framework built with TypeScript, Express, and best practices.

## 🚀 Quick Start

### Development

```bash
npm install
npm run start:dev
```

### Production

```bash
npm run start
```

### Staging

```bash
npm run start:staging
```

## 📁 Project Structure

```
├── package.json          # Project dependencies and scripts
├── README.md             # Project documentation
├── config/               # All configuration files
│   ├── eslint.config.js  # ESLint configuration
│   ├── nodemon.json      # Nodemon configuration
│   ├── ecosystem.config.js # PM2 configuration
│   ├── tsconfig.json     # TypeScript configuration
│   ├── .prettierrc.js    # Prettier configuration
│   ├── .prettierignore   # Prettier ignore rules
│   └── .swcrc           # SWC configuration
├── scripts/              # Build and utility scripts
│   ├── build.js          # Build script
│   ├── env-loader.js     # Environment loader
│   └── scripts.md        # Scripts documentation
├── src/                  # Application source code
├── _lessjs/              # Framework core
├── dist/                 # Compiled output
└── logs/                 # Application logs
```

## 🔧 Available Scripts

- `npm run start:dev` - Start development server with hot reload
- `npm run start` - Build and start production server
- `npm run start:staging` - Build and start staging server
- `npm run build` - Build the application
- `npm run clean` - Clean build artifacts
- `npm run lint` - Lint and fix code issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

## 📖 Documentation

For detailed script documentation, see [scripts/scripts.md](scripts/scripts.md).

## 🛠️ Configuration

All configuration files are organized in the `config/` directory:

- **ESLint**: Code linting rules
- **Prettier**: Code formatting rules
- **TypeScript**: Compilation settings
- **Nodemon**: Development server settings
- **PM2**: Production process management

## 🔒 Security Features

- CORS protection with configurable origins
- Rate limiting
- XSS protection
- MongoDB injection protection
- HTTP Parameter Pollution (HPP) protection
- Security headers with Helmet
- Input sanitization

## 🌍 Environment Configuration

Create environment files in the root directory:

- `.env` - Production environment
- `.env.staging` - Staging environment
- `.env.dev` - Development environment

## 📝 License

ISC
