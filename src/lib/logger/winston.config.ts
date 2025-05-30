// src/lib/logger/winston.config.ts
import winston from 'winston';
import * as Sentry from '@sentry/node'; // Assuming Sentry Node SDK for server
// Sentry.init() will be called in sentry.server.config.ts (Task 2)
// For SentryWinstonTransport to work, Sentry must be initialized.
// We require it here to ensure it's available after potential Sentry init.
// const { SentryWinstonTransport } = require('@sentry/winston-transport'); // We'll conditionally add this

const { combine, timestamp, json, simple, colorize, printf, errors } = winston.format;

const getTimestampLog = () => new Date().toISOString();

const devFormat = printf(({ level, message, timestamp: ts, module, stack, ...metadata }) => {
  let msg = `${ts} [${module || 'App'}] ${level}: ${message} `;
  if (Object.keys(metadata).length) {
    // Filter out symbols or other non-serializable properties if any
    const serializableMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
      if (typeof value !== 'symbol') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    if (Object.keys(serializableMetadata).length) {
      msg += JSON.stringify(serializableMetadata, null, 2);
    }
  }
  if (stack) {
    msg += `\nStack: ${stack}`;
  }
  return msg;
});

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production'
      ? combine(
          errors({ stack: true }), // Log stack traces
          timestamp({ format: getTimestampLog }), 
          json()
        )
      : combine(
          errors({ stack: true }),
          colorize(), 
          timestamp({ format: getTimestampLog }), 
          devFormat
        ),
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  }),
];

// Add Sentry transport if DSN is configured (typically for staging/production)
// This will only work effectively once Sentry.init() has been called (Task 2).
if (process.env.SENTRY_DSN && Sentry.SDK_VERSION) { // Check if Sentry is initialized
  try {
    const { SentryWinstonTransport } = require('@sentry/winston-transport');
    transports.push(
      new SentryWinstonTransport({
        sentry: Sentry,
        level: 'warn', // Send warnings and errors to Sentry
        format: winston.format.combine(
            errors({ stack: true }), // Ensure stack traces are included for Sentry
            timestamp({ format: getTimestampLog })
            // Sentry transport usually handles its own formatting for Sentry events
        ),
      })
    );
  } catch (e) {
    console.error(`[${getTimestampLog()}] WinstonConfig: Failed to load @sentry/winston-transport. Sentry logging for Winston might not be active. Error:`, e);
  }
} else if (process.env.SENTRY_DSN && !Sentry.SDK_VERSION) {
    console.warn(`[${getTimestampLog()}] WinstonConfig: SENTRY_DSN is set, but Sentry SDK does not seem to be initialized. Winston Sentry transport not added.`);
}


const mainLogger = winston.createLogger({
  format: combine(
    errors({ stack: true }), // Default to include stack traces if error objects are passed
    timestamp({ format: getTimestampLog }),
    json() // Default to JSON for structured logging; dev console uses devFormat
  ),
  transports: transports,
  exitOnError: false, // Do not exit on handled exceptions
});

export default mainLogger;
