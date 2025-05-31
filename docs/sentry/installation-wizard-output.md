studio-3529264553:~/studio{feat/jules-auth-refactor}$ npx @sentry/wizard@latest -i nextjs --saas --org rotina-natural --project javascript-nextjs
Need to install the following packages:
@sentry/wizard@5.0.0
Ok to proceed? (y) y


┌   Sentry Next.js Wizard 
│
◇   ────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                   │
│  The Sentry Next.js Wizard will help you set up Sentry for your application.                      │
│  Thank you for using Sentry :)                                                                    │
│                                                                                                   │
│  Version: 5.0.0                                                                                   │
│                                                                                                   │
│  This wizard sends telemetry data and crash reports to Sentry. This helps us improve the Wizard.  │
│  You can turn this off at any time by running sentry-wizard --disable-telemetry.                  │
│                                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────╯
│
▲  You have uncommitted or untracked files in your repo:
│  
│  - package.json
│  
│  The wizard will create and update files.
│
◇  Do you want to continue anyway?
│  Yes
│
●  If the browser window didn't open automatically, please open the following link to log into Sentry:
│  
│  https://sentry.io/account/settings/wizard/sw91p572mcezk2pjg6mxxbfutyr1j04hwowc6hx2tpt1wq5fo3wgldhrt97zr7ot/?org_slug=rotina-natural&project_slug=javascript-nextjs&project_platform=javascript-nextjs
│
◇  Login complete.
│
◇  Selected project rotina-natural/javascript-nextjs
│
◇  Installed @sentry/nextjs with NPM.
│
◇  Do you want to route Sentry requests in the browser through your Next.js server to avoid ad blockers?
│  Yes
│
◇  Do you want to enable Tracing to track the performance of your application?
│  No
│
◇  Do you want to enable Session Replay to get a video-like reproduction of errors during a user session?
│  No
│
◆  Created fresh sentry.server.config.ts.
│
◆  Created fresh sentry.edge.config.ts.
│
◆  Added new src/instrumentation.ts file.
│
◆  Added new src/instrumentation-client.ts file.
│
◇  next.config.ts already contains Sentry SDK configuration. Should the wizard modify it anyways?
│  Yes
│
◆  Added Sentry configuration to next.config.ts. (you probably want to clean this up a bit!)
│
◆  Created src/app/global-error.tsx.
│
◇  Do you want to create an example page ("/sentry-example-page") to test your Sentry setup?
│  Yes
│
◆  Created src/app/sentry-example-page/page.tsx.
│
◆  Created src/app/api/sentry-example-api/route.ts.
│
◆  Created .env.sentry-build-plugin with auth token for you to test source map uploading locally.
│
◆  Added .env.sentry-build-plugin to .gitignore.
│
◇  Warning: The Sentry SDK is only compatible with Turbopack on Next.js version 15.3.0 (or 15.3.0-canary.8) or later. If you are using Turbopack with an older Next.js version, temporarily remove
`--turbo` or `--turbopack` from your dev command until you have verified the SDK is working as expected. Note that the SDK will continue to work for non-Turbopack production builds.
│  I understand.
│
◇  Are you using a CI/CD tool to build and deploy your application?
│  Yes
│
◇  Add the Sentry authentication token as an environment variable to your CI setup:

SENTRY_AUTH_TOKEN=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

│
▲  DO NOT commit this auth token to your repository!
│
■  Did you configure CI as shown above?
│  Yes, continue!
│
└  Wizard setup cancelled.

studio-3529264553:~/studio{feat/jules-auth-refactor}$ ^C
studio-3529264553:~/studio{feat/jules-auth-refactor}$ npx @sentry/wizard@latest -i nextjs --saas --org rotina-natural --project javascript-nextjs

┌   Sentry Next.js Wizard 
│
◇   ────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                   │
│  The Sentry Next.js Wizard will help you set up Sentry for your application.                      │
│  Thank you for using Sentry :)                                                                    │
│                                                                                                   │
│  Version: 5.0.0                                                                                   │
│                                                                                                   │
│  This wizard sends telemetry data and crash reports to Sentry. This helps us improve the Wizard.  │
│  You can turn this off at any time by running sentry-wizard --disable-telemetry.                  │
│                                                                                                   │
├───────────────────────────────────────────────────────────────────────────────────────────────────╯
│
▲  You have uncommitted or untracked files in your repo:
│  
│  - .gitignore
│  - next.config.ts
│  - package-lock.json
│  - package.json
│  - sentry.edge.config.ts
│  - sentry.server.config.ts
│  - src/app/api/
│  - src/app/global-error.tsx
│  - src/app/sentry-example-page/
│  - src/instrumentation-client.ts
│  - src/instrumentation.ts
│  
│  The wizard will create and update files.
│
◇  Do you want to continue anyway?
│  Yes
│
●  If the browser window didn't open automatically, please open the following link to log into Sentry:
│  
│  https://sentry.io/account/settings/wizard/rw3vof0bw2xpvgywce3etqz5i27d5vkh0gidc9wytunarjo3zerbm96vo0bicgm2/?org_slug=rotina-natural&project_slug=javascript-nextjs&project_platform=javascript-nextjs
│
◇  Login complete.
│
◇  Selected project rotina-natural/javascript-nextjs
│
◇  The @sentry/nextjs package is already installed. Do you want to update it to the latest version?
│  Yes
│
◇  Updated @sentry/nextjs with NPM.
│
◇  Do you want to route Sentry requests in the browser through your Next.js server to avoid ad blockers?
│  Yes
│
◇  Do you want to enable Tracing to track the performance of your application?
│  No
│
◇  Do you want to enable Session Replay to get a video-like reproduction of errors during a user session?
│  No
│
◇  Found existing Sentry server config (sentry.server.config.ts). Overwrite it?
│  Yes
│
▲  Removed existing sentry.server.config.ts.
│
◆  Created fresh sentry.server.config.ts.
│
◇  Found existing Sentry edge config (sentry.edge.config.ts). Overwrite it?
│  Yes
│
▲  Removed existing sentry.edge.config.ts.
│
◆  Created fresh sentry.edge.config.ts.
│
◇  Add the following code to your instrumentation.ts file:

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;


│
◇  Did you apply the snippet above?
│  Yes, continue!
│
◇  Add the following code to your instrumentation-client.ts file:

// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3369126b9ed988a89c4b09b39cb08591@o4509414416711680.ingest.us.sentry.io/4509414501187585",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

│
◇  Did you apply the snippet above?
│  Yes, continue!
│
◇  next.config.ts already contains Sentry SDK configuration. Should the wizard modify it anyways?
│  Yes
│
◆  Added Sentry configuration to next.config.ts. (you probably want to clean this up a bit!)
│
●  It seems like you already have a custom error page for your app directory.
│  
│  Please add the following code to your custom error page
│  at src/app/global-error.tsx:
│  
"use client";

import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({ error }: { error: Error }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* Your Error component here... */}
      </body>
    </html>
  );
}

│
◇  Did you add the code to your src/app/global-error.tsx file as described above?
│  Yes
│
◇  Do you want to create an example page ("/sentry-example-page") to test your Sentry setup?
│  Yes
│
◆  Created src/app/sentry-example-page/page.tsx.
│
◆  Created src/app/api/sentry-example-api/route.ts.
│
◆  Added auth token to .env.sentry-build-plugin
│
●  .gitignore already has .env.sentry-build-plugin. Will not add it again.
│
◇  Warning: The Sentry SDK is only compatible with Turbopack on Next.js version 15.3.0 (or 15.3.0-canary.8) or later. If you are using Turbopack with an older Next.js version, temporarily remove
`--turbo` or `--turbopack` from your dev command until you have verified the SDK is working as expected. Note that the SDK will continue to work for non-Turbopack production builds.
│  I understand.
│
◇  Are you using a CI/CD tool to build and deploy your application?
│  Yes
│
◇  Add the Sentry authentication token as an environment variable to your CI setup:

SENTRY_AUTH_TOKEN=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

│
▲  DO NOT commit this auth token to your repository!
│
◇  Did you configure CI as shown above?
│  Yes, continue!
│
└  
Successfully installed the Sentry Next.js SDK! 

You can validate your setup by (re)starting your dev environment (e.g. npm run dev) and visiting "/sentry-example-page"
Don't forget to remove `--turbo` or `--turbopack` from your dev command until you have verified the SDK is working. You can safely add it back afterwards.

If you encounter any issues, let us know here: https://github.com/getsentry/sentry-javascript/issues