Here are the specifics about the logging system proposed by Bedrock, covering both client-side and server-side aspects:
The Bedrock architecture incorporates a logging system designed for both server-side and client-side operations, with centralized configuration and integration with external observability platforms like Sentry.

Server-Side Logging:

Tool: The server-side uses Winston for structured logging.

Configuration: The configuration for Winston resides in src/lib/logger/winston.config.ts. This centralizes logging setup.

Usage: To get a logger instance on the server, you use a factory function called getServerLogger(moduleName: string) which is provided by src/lib/logger/index.ts. This function allows you to obtain logger instances specific to the module you are working in.

Where Used: getServerLogger instances are used within services, API routes, and Server Actions.

Services use getServerLogger('ServiceName') to log operations, parameters (being mindful to mask PII), and errors. Examples show its use in user-profile.service.ts and order.service.ts.

Server Actions and API route handlers can also use getServerLogger.

Error Handling Integration: Services are specifically instructed to log errors with context using getServerLogger() before throwing errors on failure. The caller (such as a Server Action or an API Route handler via createApiRouteHandler) is then responsible for catching these errors and may log them again at a higher level, potentially with request context, before formatting the final client response.

Observability Integration: Server-side logging is integrated with an observability platform like Sentry. Configuration for this integration will be in files like sentry.server.config.ts.

Testing: getServerLogger should be mocked when writing unit tests for services to isolate the logic being tested.

Client-Side Logging:

Tool: The client-side uses a custom logger.

Configuration/Location: This custom logger is defined in src/lib/logger/client.logger.ts. This location is for generic, core utilities.

Usage: You can obtain client-side logger instances using getClientLogger('moduleName'). This logger can provide instances specific to a component or module.

How it Reports: The client-side logger is designed to send critical logs (specifically errors and warnings) to a dedicated Next.js API route (e.g., /api/logs/client). It uses an authenticated utility function (presumably from src/lib/utils/api.utils.ts) to call this API route. Once the logs reach this server-side API route, they are then processed and logged using the server-side logger (Winston).

API Endpoint Security: The API endpoint receiving client logs (/api/logs/client) should have appropriate security measures, such as rate limiting, implemented to prevent abuse, even if the logged content is not highly sensitive.

Observability Integration: Client-side logging also integrates with an observability platform like Sentry. Sentry client-side initialization (sentry.client.config.ts) captures unhandled exceptions and performance data from the client.

Example Use Case: The useAuth hook specifically uses getClientLogger('useAuth') for logging errors related to authentication on the client side.

In summary, Bedrock's logging strategy involves distinct but connected systems for server and client. The server uses Winston with getServerLogger instances within services, actions, and API routes, integrating with Sentry server-side. The client uses a custom logger (getClientLogger) that sends critical logs via a secured API route to the server for processing by the server-side logger, complementing Sentry's client-side exception and performance monitoring. Centralized configuration in src/lib/logger/ and co-located testing (.test.ts files alongside source files) support this system.