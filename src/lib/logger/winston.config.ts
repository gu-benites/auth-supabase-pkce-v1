// src/lib/logger/winston.config.ts
import winston from 'winston';
import * as Sentry from '@sentry/nextjs'; // Use @sentry/nextjs for consistency
import Transport from 'winston-transport'; // Official way to import base Transport

const { combine, timestamp, json, simple, colorize, printf, errors } = winston.format;

const getTimestampLog = () => new Date().toISOString();

const devFormat = printf(({ level, message, timestamp: ts, module, stack, ...metadata }) => {
  let msg = `${ts} [${module || 'App'}] ${level}: ${message} `;
  if (Object.keys(metadata).length) {
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
          errors({ stack: true }), 
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

// Add Sentry transport if DSN is configured, using the new Sentry.createSentryWinstonTransport
if (process.env.SENTRY_DSN) {
  // Sentry SDK should be initialized by src/instrumentation.ts before this runs.
  // Check if createSentryWinstonTransport function exists on the Sentry object.
  if (Sentry && typeof Sentry.createSentryWinstonTransport === 'function') {
    try {
      // Create the Sentry transport constructor
      const SentryTransportConstructor = Sentry.createSentryWinstonTransport(Transport, {
        levels: ['warn', 'error'], // Only capture warn and error logs from Winston
        // The Sentry instance is implicitly the one `createSentryWinstonTransport` was called on.
      });
      // Instantiate and add to transports
      transports.push(new SentryTransportConstructor());
      // Log this message using the console as mainLogger might not be fully ready with all transports
      // This message will appear in console logs during startup if Sentry transport is added.
      console.log(`[${getTimestampLog()}] WinstonConfig: Sentry transport for Winston added for levels: warn, error.`);
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e));
      console.error(`[${getTimestampLog()}] WinstonConfig: Failed to initialize Sentry transport for Winston. Error: ${error.message}`, { stack: error.stack });
    }
  } else {
    // This case might happen if Sentry SDK is not properly loaded or an unexpected version is used.
    console.warn(`[${getTimestampLog()}] WinstonConfig: Sentry.createSentryWinstonTransport is not available or Sentry SDK not properly initialized. Sentry transport for Winston not added.`);
  }
} else {
  // Log this message using the console as mainLogger might not be fully ready.
  console.log(`[${getTimestampLog()}] WinstonConfig: SENTRY_DSN not set. Sentry transport for Winston not added.`);
}


const mainLogger = winston.createLogger({
  format: combine(
    errors({ stack: true }), 
    timestamp({ format: getTimestampLog }),
    json() 
  ),
  transports: transports,
  exitOnError: false, 
});

export default mainLogger;
