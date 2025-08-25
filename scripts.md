# 📋 NPM Scripts Documentation

## 🏗️ **Build & Compilation**

- **`npm run build`** - Compile TypeScript and run build script
- **`npm run clean`** - Delete dist/ folder for fresh builds

## 🚀 **Server Startup**

- **`npm run start:dev`** - Development server with hot reload (nodemon)
- **`npm run start`** - Build and start production server with PM2
- **`npm run start:staging`** - Build and start staging server with PM2

## 🔍 **Code Quality**

- **`npm run type-check`** - Validate TypeScript types (fast, no compilation)
- **`npm run lint`** - Check for code issues and auto-fix
- **`npm run format`** - Format all files with Prettier

## 🔧 **Other**

- **`npm test`** - Run test suite (placeholder)
- **`npm run prepare`** - Setup Git hooks (auto-runs after install)

## 📊 **PM2 Process Management & Logs**

### **Process Status**

- **`npx pm2 list`** or **`npx pm2 ls`** - Show all running processes
- **`npx pm2 status`** - Detailed process information
- **`npx pm2 show <process-name>`** - Show detailed info for specific process
- **`npx pm2 monit`** - Interactive monitoring dashboard with real-time logs

### **Log Viewing**

- **`npx pm2 logs`** - View logs for all processes
- **`npx pm2 logs <process-name>`** - View logs for specific process
- **`npx pm2 logs lessjs-prod`** - View production logs
- **`npx pm2 logs lessjs-staging`** - View staging logs
- **`npx pm2 logs --lines 50`** - Show last 50 lines
- **`npx pm2 logs --follow`** - Follow logs in real-time (like tail -f)
- **`npx pm2 logs lessjs-prod --follow`** - Follow specific process logs

### **Process Control**

- **`npx pm2 start ecosystem.config.js --only lessjs-prod --env production`** - Start production
- **`npx pm2 start ecosystem.config.js --only lessjs-staging --env staging`** - Start staging
- **`npx pm2 start .pm2dev.config.js`** - Start development with PM2
- **`npx pm2 restart <process-name>`** - Restart specific process
- **`npx pm2 stop <process-name>`** - Stop specific process
- **`npx pm2 delete <process-name>`** - Delete process from PM2
- **`npx pm2 reload <process-name>`** - Zero-downtime reload (cluster mode only)

### **Stop All Processes**

- **`npx pm2 stop all`** - Stop all PM2 processes (safest method)
- **`npx pm2 delete all`** - Stop and remove all processes from PM2
- **`npx pm2 kill`** - Kill PM2 daemon and all processes (nuclear option)

### **Log Files Location**

```
./logs/pm2/
├── prod-error.log      # Production errors
├── prod-out.log        # Production output
├── prod-combined.log   # Production combined
├── staging-error.log   # Staging errors
├── staging-out.log     # Staging output
├── staging-combined.log # Staging combined
├── dev-error.log       # Development errors
├── dev-out.log         # Development output
└── dev-combined.log    # Development combined
```

### **Log Management**

- **`npx pm2 flush`** - Clear all PM2 logs
- **`npx pm2 flush <process-name>`** - Clear logs for specific process
- **`npx pm2 install pm2-logrotate`** - Install log rotation module

## 🔄 **Common Workflows**

**Development:**

```bash
npm run start:dev    # Start development server
npm run lint         # Check and fix code issues
npm run format       # Format code
```

**Production Deployment:**

```bash
npm run start        # Build and start production
```

**Staging Deployment:**

```bash
npm run start:staging # Build and start staging
```

**PM2 Monitoring:**

```bash
npx pm2 list         # Check process status
npx pm2 monit        # Interactive monitoring
npx pm2 logs --follow # Follow all logs in real-time
```

**Stop All Processes:**

```bash
npx pm2 stop all     # Stop all processes safely
npx pm2 delete all   # Stop and remove from PM2
```

**Code Quality Check:**

```bash
npm run type-check   # Validate TypeScript
npm run lint         # Check for issues
npm run format       # Format files
```
