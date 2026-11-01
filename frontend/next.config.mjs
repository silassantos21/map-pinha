import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o Turbopack suba a raiz do projeto procurando um lockfile
  // até achar um fora do repositório (ex: um package-lock.json global do usuário).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withSentryConfig(nextConfig, {
  org: "silassantos30",
  project: "mapinha-frontend",
  // Sem SENTRY_AUTH_TOKEN (não configurado — projeto não usa CI com upload de
  // source maps ainda), o upload é pulado silenciosamente no build; o restante
  // da integração (captura de erros em runtime) funciona normalmente sem ele.
  silent: true,
  widenClientFileUpload: true,
  disableLogger: true,
  automaticVercelMonitors: false,
});
