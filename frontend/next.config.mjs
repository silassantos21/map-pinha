/** @type {import('next').NextConfig} */
const nextConfig = {
  // Evita que o Turbopack suba a raiz do projeto procurando um lockfile
  // até achar um fora do repositório (ex: um package-lock.json global do usuário).
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
