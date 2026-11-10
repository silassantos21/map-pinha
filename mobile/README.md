# MaPinha — app mobile (Expo)

Fase 10 Parte 2 (`docs/04_TIMELINE.md`/`SPRINTS.md`) — login com Google e mapa
somente-leitura mostrando os POIs já cadastrados na web. Sem emulador nem Mac
disponíveis no ambiente de desenvolvimento, então o app só foi validado por
código (`npx tsc --noEmit`) — o teste de verdade (login, mapa com dados reais)
depende de rodar num celular Android físico, com os passos abaixo.

**Por que não dá pra testar só no Expo Go:** o `react-native-maps` e outras
dependências nativas não existem dentro do app Expo Go — é preciso gerar uma
**development build** própria (via EAS Build) e instalar ela no celular. Só
depois disso o app roda normalmente (como qualquer app instalado), com hot
reload do código igual ao Expo Go.

**Nota sobre o login:** inicialmente implementamos com o SDK nativo
(`@react-native-google-signin/google-signin`), mas trocamos por login via
navegador (`expo-auth-session`) depois de confirmar — via issues oficiais do
pacote (#1350, #1330, #1362 no GitHub do google-signin) — que o módulo
nativo dele falha de forma intermitente em builds Expo com a New
Architecture (o mesmo build funciona em uma abertura do app e falha na
próxima, sem padrão), sem correção publicada pelos mantenedores. O login via
navegador não depende de módulo nativo nenhum pra essa parte.

## 1. Conta Expo + EAS CLI

```bash
cd mobile
npx eas login   # cria conta gratuita em expo.dev se ainda não tiver
```

## 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha `EXPO_PUBLIC_API_URL` com o IP local da sua máquina (não
`localhost`) — no Windows, `ipconfig` e pegue o "Endereço IPv4" da rede
Wi-Fi (ex: `http://192.168.0.42:8000`). O celular precisa estar na mesma
rede Wi-Fi que o PC.

## 3. Google Cloud Console — 2 cadastros (mesmo projeto já usado pelo NextAuth)

Acesse [Google Cloud Console > APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials), no mesmo projeto onde já existe o OAuth Client usado pelo `frontend/.env.local` (`GOOGLE_CLIENT_ID`):

1. **Reaproveite o Client ID tipo "Web" que já existe** (o mesmo do NextAuth) — copie o valor pra `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (`.env` deste pacote) **e** pra `GOOGLE_MOBILE_CLIENT_ID` (`backend/.env`) — precisam ser idênticos. Nesse mesmo client Web, abra "URIs de redirecionamento autorizados" e adicione `https://mapinha-iota.vercel.app/mobile-auth-redirect.html` (o Google não aceita mais um esquema customizado tipo `mapinha://` direto — essa é uma página-ponte estática, já em `frontend/public/mobile-auth-redirect.html`, que recebe o retorno do Google e repassa pro app via `mapinha://`; precisa estar publicada no site antes de testar).
2. **Ative "Maps SDK for Android"** ([APIs & Services > Library](https://console.cloud.google.com/apis/library)) e crie uma API key em Credentials — cole em `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY`.

Não é preciso criar um Client ID tipo "Android" — o login usa o client "Web"
via navegador (`expo-auth-session`), não o SDK nativo do Google.

## 4. Primeiro build (development build)

```bash
npx eas build --platform android --profile development
```

Primeira vez demora ~10-20 min (build na nuvem da Expo, gratuito no plano
free). Ao final, a EAS dá um link/QR code pra baixar um `.apk` — baixe e
instale direto no celular Android (ative "Instalar de fontes desconhecidas"
se o Android pedir; não precisa de Play Store).

## 5. Rodar o app

```bash
npx expo start --dev-client
```

Abre o app development build instalado no celular (não o Expo Go) e escaneie
o QR code — a partir daqui, hot reload funciona normalmente a cada mudança
de código, sem precisar gerar build de novo (só é preciso rebuildar se mudar
dependência nativa nova, não por mudança de tela/lógica).

## Fora de escopo desta parte

Criar/editar POI, social (seguir/grupos/comentários), troca de tema de mapa
no app, geofence/notificação de proximidade (Parte 5, motivo original da
Fase 10) — tudo isso fica pra partes futuras, ver `docs/04_TIMELINE.md`.
