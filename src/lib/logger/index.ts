// src/lib/logger/index.ts
import mainLogger from './winston.config';
import type { Logger as WinstonLogger, Logform } from 'winston';

// Extend Winston's Logger type if needed, or use as is
// interface Logger extends WinstonLogger {} // No specific extensions needed for now

/**
 * Returns a child logger instance from the main Winston logger,
 * tagged with a specific module name for contextual logging.
 *
 * @param {string} [moduleName='Application'] - The name of the module this logger is for.
 * @returns {WinstonLogger} The Winston logger instance, configured with the module name.
 * @example
 * import { getServerLogger } from '@/lib/logger';
 * const logger = getServerLogger('MyService');
 * logger.info('Service started');
 */
export function getServerLogger(moduleName: string = 'Application'): WinstonLogger {
  // Create a child logger to add module context
  // The child logger inherits format, level, and transports from the parent.
  return mainLogger.child({ module: moduleName });
}
