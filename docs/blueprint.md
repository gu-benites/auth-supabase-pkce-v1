# **App Name**: PassForge

## Core Features:

- Email Input: Email Input: A field for the user to enter their email address to initiate the password reset process that calls Supabase's resetPasswordForEmail.
- Confirmation Display: Success Message: Displays a message to the user confirming that a password reset email has been sent.
- Token Exchange: Token Exchange Endpoint: Route handler at /auth/confirm to handle token exchange after user clicks the link in their email, using the utility functions provided by the documentation.
- Reset Initiation: Initiate Reset: A function that calls Supabase's with the provided email address.
- Update Password Form: New Password Form: After successful token exchange, show a form with two fields where the user can enter their new password. This form should link to an API endpoint that updates the password in supabase await supabase.auth.updateUser({ password: 'new_password' })
- Tech Stack: Tech Stack: React, NextJS, Supabase SSR, Supabase JS V2.0
- Strictly Follow Official Docs: Strictly follow official docs.
- Official Password Docs: Official documentation: https://supabase.com/docs/guides/auth/passwords?queryGroups=language&language=js&queryGroups=flow&flow=pkce&queryGroups=framework&framework=nextjs
- Official Server Side Docs: https://supabase.com/docs/guides/auth/server-side/nextjs

## Style Guidelines:

- Primary color: A gentle sky blue (#77B5FE), reminiscent of clear skies and trust.
- Background color: A very light, desaturated blue (#F0F8FF) creating a calm, uncluttered atmosphere.
- Accent color: A soft lavender (#A892EA), adding a touch of elegance.
- Clean, sans-serif font for form labels and instructions.
- Simple, centered layout for each step in the password reset process.
- A subtle fade-in effect for each stage.