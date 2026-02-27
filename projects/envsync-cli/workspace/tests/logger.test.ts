import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import loggerModule from '../src/logger'; // default export is getLogger
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Grab the exported function
const getLogger = loggerModule.getLogger;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'envsync.log');

// Clean up any log files before/after tests
beforeAll(() => {
  if (existsSync(LOG_DIR)) {
    rmSync(LOG_DIR, { recursive: true, force: true });
  }
});

afterAll(() => {
  if (existsSync(LOG_DIR)) {
    rmSync(LOG_DIR, { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('logger.ts', () => {
  it('creates a logger with console and daily rotate transports', () => {
    const name = 'test-logger';
    const logger = getLogger(name);

    // Verify logger is a winston logger
    expect(logger).toBeInstanceOf(winston.Logger);

    // Verify transports
    const transportNames = logger.transports.map(t => t.name);
    expect(transportNames).toContain('console');
    expect(transportNames).toContain('dailyRotateFile');

    // Verify daily rotate file path
    const fileTransport = logger.transports.find(
      t => t instanceof DailyRotateFile,
    ) as DailyRotateFile;
    expect(fileTransport).toBeDefined();
    expect(fileTransport.dirname).toBe(LOG_DIR);
    expect(fileTransport.filename).toBe('envsync.log');
  });

  it('uses the default log level when ENV_SYNC_LOG_LEVEL is not set', () => {
    const logger = getLogger('default-level');
    // winston default is 'info' if not overridden
    expect(logger.level).toBe('info');
  });

  it('overrides log level with ENV_SYNC_LOG_LEVEL env variable', () => {
    const original = process.env.ENV_SYNC_LOG_LEVEL;
    process.env.ENV_SYNC_LOG_LEVEL = 'debug';

    const logger = getLogger('override-level');
    expect(logger.level).toBe('debug');

    // Restore
    process.env.ENV_SYNC_LOG_LEVEL = original;
  });

  it('creates the log directory if it does not exist', () => {
    // Ensure dir does not exist
    if (existsSync(LOG_DIR)) {
      rmSync(LOG_DIR, { recursive: true, force: true });
    }
    expect(existsSync(LOG_DIR)).toBe(false);

    // Trigger logger creation
    getLogger('mkdir-test');

    expect(existsSync(LOG_DIR)).toBe(true);
  });

  it('caches loggers by name', () => {
    const loggerA1 = getLogger('cached');
    const loggerA2 = getLogger('cached');
    const loggerB = getLogger('other');

    expect(loggerA1).toBe(loggerA2); // same instance
    expect(loggerA1).not.toBe(loggerB); // different instance
  });

  it('logs a message to the rotating file', () => {
    const logger = getLogger('file-test');
    const testMsg = 'Hello, EnvSync!';

    // Log a message
    logger.info(testMsg);

    // Wait a tick for async file write
    return new Promise<void>(resolve => {
      setTimeout(() => {
        // Read the latest log file
        const files = readFileSync(LOG_FILE, { encoding: 'utf-8' });
        expect(files).toContain(testMsg);
        resolve();
      }, 50);
    });
  });

  // Edge‑case: empty name
  it('creates a logger even when name is an empty string', () => {
    const logger = getLogger('');
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  // Edge‑case: name with special characters
  it('creates a logger for names with special characters', () => {
    const specialName = '🌟$#@!';
    const logger = getLogger(specialName);
    expect(logger).toBeInstanceOf(winston.Logger);
  });

  // Security: ensure logger does not log environment variable names
  it('does not accidentally log env var names from process.env', () => {
    const logger = getLogger('security-test');
    const msg = 'Test message';
    logger.info(msg);

    const logs = readFileSync(LOG_FILE, { encoding: 'utf-8' });
    // Ensure no env var names appear in logs
    expect(logs).not.toMatch(/AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|GOOGLE_APPLICATION_CREDENTIALS/);
  });
});
