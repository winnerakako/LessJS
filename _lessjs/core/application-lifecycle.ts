import { Server } from 'http';

/**
 * Application Lifecycle Manager
 * Following NestJS patterns for proper server lifecycle management
 * Works consistently in both development and production
 */
export class ApplicationLifecycle {
  private static instance: ApplicationLifecycle | null = null;
  private server: Server | null = null;
  private isShuttingDown = false;
  private shutdownTimeoutId: NodeJS.Timeout | null = null;
  private readonly shutdownTimeout = 30000; // 30 seconds max shutdown time

  // Cleanup hooks for graceful shutdown
  private cleanupHooks: Array<() => Promise<void> | void> = [];

  private constructor() {
    this.setupSignalHandlers();
  }

  static getInstance(): ApplicationLifecycle {
    if (!ApplicationLifecycle.instance) {
      ApplicationLifecycle.instance = new ApplicationLifecycle();
    }
    return ApplicationLifecycle.instance;
  }

  /**
   * Register the HTTP server instance
   */
  setServer(server: Server): void {
    this.server = server;
    console.log('[Lifecycle] HTTP server registered');
  }

  /**
   * Add cleanup hooks that will be called during graceful shutdown
   * Similar to NestJS onApplicationShutdown
   */
  addCleanupHook(hook: () => Promise<void> | void): void {
    this.cleanupHooks.push(hook);
  }

  /**
   * Setup signal handlers for graceful shutdown
   * Works the same in development and production
   */
  private setupSignalHandlers(): void {
    // Handle termination signals
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];

    // Add Windows-specific signal
    if (process.platform === 'win32') {
      signals.push('SIGBREAK' as NodeJS.Signals);
    }

    signals.forEach((signal) => {
      process.on(signal, () => {
        console.log(
          `[Lifecycle] Received ${signal}, starting graceful shutdown...`
        );
        this.gracefulShutdown(signal);
      });
    });

    // Handle uncaught exceptions gracefully
    process.on('uncaughtException', (error) => {
      console.error('[Lifecycle] Uncaught Exception:', error);
      this.gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error(
        '[Lifecycle] Unhandled Rejection at:',
        promise,
        'reason:',
        reason
      );
      this.gracefulShutdown('UNHANDLED_REJECTION');
    });
  }

  /**
   * Graceful shutdown process
   * Similar to NestJS application shutdown
   */
  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      console.log('[Lifecycle] Shutdown already in progress, ignoring signal');
      return;
    }

    this.isShuttingDown = true;

    // Set a timeout for forced shutdown
    this.shutdownTimeoutId = setTimeout(() => {
      console.error(
        '[Lifecycle] Graceful shutdown timeout reached, forcing exit'
      );
      process.exit(1);
    }, this.shutdownTimeout);

    try {
      console.log('[Lifecycle] Starting graceful shutdown sequence...');

      // Step 1: Stop accepting new connections
      if (this.server) {
        console.log(
          '[Lifecycle] Stopping server from accepting new connections...'
        );
        this.server.close(() => {
          console.log('[Lifecycle] Server closed successfully');
        });
      }

      // Step 2: Run cleanup hooks (database connections, etc.)
      console.log('[Lifecycle] Running cleanup hooks...');
      await this.runCleanupHooks();

      // Step 3: Wait for existing connections to finish
      if (this.server) {
        await this.waitForConnectionsDrain();
      }

      // Clear the forced shutdown timeout
      if (this.shutdownTimeoutId) {
        clearTimeout(this.shutdownTimeoutId);
        this.shutdownTimeoutId = null;
      }

      console.log('[Lifecycle] Graceful shutdown completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('[Lifecycle] Error during graceful shutdown:', error);

      // Clear timeout if it exists
      if (this.shutdownTimeoutId) {
        clearTimeout(this.shutdownTimeoutId);
      }

      process.exit(1);
    }
  }

  /**
   * Run all registered cleanup hooks
   */
  private async runCleanupHooks(): Promise<void> {
    for (const hook of this.cleanupHooks) {
      try {
        await hook();
      } catch (error) {
        console.error('[Lifecycle] Error in cleanup hook:', error);
      }
    }
  }

  /**
   * Wait for existing connections to drain
   */
  private async waitForConnectionsDrain(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        resolve();
        return;
      }

      // Check if server is already closed
      if (!this.server.listening) {
        resolve();
        return;
      }

      // Wait for connections to drain
      const checkInterval = setInterval(() => {
        // In newer Node.js versions, we can check connection count
        // For now, we'll use a simple timeout approach
        console.log('[Lifecycle] Waiting for connections to drain...');
      }, 1000);

      // Give connections some time to finish
      setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[Lifecycle] Connection drain timeout reached');
        resolve();
      }, 10000); // 10 second timeout for connection draining
    });
  }

  /**
   * Handle port conflicts gracefully
   * Instead of killing processes, provide helpful information
   */
  static handlePortConflict(port: number, error: NodeJS.ErrnoException): void {
    console.error(`\n❌ Cannot start server: Port ${port} is already in use`);
    console.error('\n🔧 Professional solutions:');
    console.error('   1. Use a different port number in your configuration');
    console.error('   2. Stop the other application using this port');
    console.error('   3. Use PM2 or similar process manager for production');

    if (process.env.NODE_ENV === 'development') {
      console.error('\n🛠️  For development:');
      console.error('   • Check if you have another dev server running');
      console.error('   • Use Ctrl+C to stop any running servers first');
      console.error(
        '   • Consider using different ports for different projects'
      );
    } else {
      console.error('\n🏭 For production:');
      console.error('   • Use a process manager like PM2');
      console.error('   • Configure load balancer to handle port management');
      console.error('   • Use container orchestration (Docker, Kubernetes)');
    }

    console.error(`\n🔍 To find what's using port ${port}:`);
    console.error(`   Windows: netstat -ano | findstr :${port}`);
    console.error(`   Linux/Mac: lsof -i :${port}`);

    console.error(
      '\n💡 This is normal behavior - the framework will not kill other processes'
    );
    console.error('   for safety and data integrity reasons.\n');
  }
}

// Export singleton instance
export const applicationLifecycle = ApplicationLifecycle.getInstance();
