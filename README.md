# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

## Supabase configuration

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and
`EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project. Reload the
app after changing them. For cloud builds, configure the same variables in the
corresponding Expo environment.

These values are included in the app bundle and are public. Use only a
publishable key (or legacy anon key), never a secret or service-role key.
Protect data with Supabase Row Level Security and appropriate policies. This
client configuration does not replace the existing backend authentication.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

## FlexPay Web: integration gaps

The following are proposed backend contracts, **not endpoints implemented or
verified by this repository**. Existing calls must not be changed to these
paths until the backend implements and documents them.

### Daily dashboard and statements

The client currently calls `GET /wallets/balance` and paginates
`GET /wallets/statements` with `limit` and `offset`. It also sends `startDate`
and `endDate`, but this repository does not establish their server-side
semantics, whether filtering occurs before pagination, or the applicable time
zone. Type filtering and displayed totals are limited to loaded records;
the totals are not full-account totals. The statement screen uses the
device's local time zone, not a configured system time zone. Multiple or
unknown currencies are not combined into a total.

To implement daily analytics reliably, define a per-wallet IANA time zone and
an authenticated daily aggregate, for example
`GET /wallets/analytics/daily?date=YYYY-MM-DD&timeZone=...`. The server should
authorize the wallet, interpret the local calendar day as a half-open interval
in that zone (including DST), and return the interval, currency, as-of time,
transaction count, sales, transfers, top-ups, deposits, commissions and fees,
plus time-bucketed movement values. Amounts should be decimal strings or
minor units, and the contract must specify status inclusion, categories,
rounding and whether sales overlap other categories. The wallet balance can
continue to come from the existing balance endpoint. Do not infer these
financial rules from paginated statements.

For complete statements, extend or document the existing endpoint with
authorized wallet context, stable ordering and pagination, inclusive local
date range or explicit UTC bounds, time zone, type and status filters applied
before pagination, and `hasMore` or a continuation cursor. Return filtered
totals per currency using the same snapshot and documented status rules, and
make the list of supported types available independently of loaded pages.
Confirm the current `startDate`, `endDate`, `limit` and `offset` behavior
before relying on them. The present client cannot guarantee complete filtered
results if the server ignores or interprets those parameters differently.

### Notifications

The existing backend notification list did not authenticate requests or scope
results to a user. The local backend keeps that route disabled and adds
`GET /notifys/me`, which authenticates and returns up to 50 recent notifications
scoped to `auth.users.id`. The modal polls this route every 15 seconds while
open and briefly highlights newly detected notifications; the first successful
response establishes the baseline. Its read controls currently change only
local UI state and do not persist read status to the backend. Deploy the backend
changes before using this screen; until then it reports a loading error.

Verify RLS, grants and existing policies on the Supabase table before treating
direct database access as secure. The hosted backend may still expose its old
route until it is deployed. An authorized, idempotent mark-as-read operation
has not been implemented. Test direct database access and the deployed API with
multiple users, including cross-user access attempts.

The payer screen also opens this notification modal. Its transfer period is
sent to the existing `GET /transfers/get-transfers` endpoint in `DD-MM-YYYY`
format; the local backend interprets its date bounds in UTC. Status filtering
and summary counts apply only to loaded pages, not to all matching transfers.
The endpoint would need a server-side status filter before pagination and
aggregate counts to provide complete results.

### Transaction PIN

Transfers and top-ups send the PIN to their existing endpoints; their
server-side verification cannot be established from this client. The legacy
settings and profile modal also sends `pin_transaction` to a profile-update endpoint, but
there is no contract proving secure storage, authorization or safe change
semantics. Audit that endpoint before relying on or enabling it in production.
The profile menu opens the existing PIN update modal; this does not establish
that the backend implements the security requirements below.

A secure backend contract should provide authenticated setup and change
operations (for example `POST /profiles/transaction-pin` and
`PUT /profiles/transaction-pin`), require reauthentication or the existing
PIN as appropriate, enforce rate limits and lockout, and return explicit
success or error codes without returning the PIN. Store only a salted,
slow password-hash verifier, never the raw PIN; do not log it. Sensitive
transaction endpoints must verify it server-side over TLS, with per-user
authorization and consistent failure handling. The UI can confirm a new PIN
locally for typo prevention, but must never treat that as authorization.

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
