import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 1.0,
});


// // This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// // The config you add here will be used whenever one of the edge features is loaded.
// // Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// // https://docs.sentry.io/platforms/javascript/guides/nextjs/

// import * as Sentry from "@sentry/nextjs";

// Sentry.init({
//   dsn: "https://c185573b8597d40761e7e3c8ef12492d@o4510471051214848.ingest.de.sentry.io/4510471054819408",

//   // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
//   tracesSampleRate: 1,

//   // Enable logs to be sent to Sentry
//   enableLogs: true,

//   // Enable sending user PII (Personally Identifiable Information)
//   // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
//   sendDefaultPii: true,
// });
