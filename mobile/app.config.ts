import type { ExpoConfig } from "expo/config";

// app.config.ts (em vez de app.json) só porque precisamos ler env vars em
// build-time — a chave do Google Maps Android e os client IDs do Google
// Sign-In entram aqui, não dá pra fazer isso num app.json estático. Ver
// README.md deste pacote pra instruções completas de setup.
const config: ExpoConfig = {
  name: "MaPinha",
  slug: "mapinha-mobile",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  scheme: "mapinha",
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.mapinha.mobile",
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    // Login com Google via expo-auth-session (navegador) — ver
    // LoginScreen.tsx. Trocamos @react-native-google-signin/google-signin
    // por essa abordagem depois de confirmar, via issues oficiais do
    // pacote (#1350, #1330, #1362), que o módulo nativo dele falha de
    // forma intermitente em builds Expo com a New Architecture (mesmo
    // build funcionando às vezes e falhando outras) — sem correção
    // publicada. expo-web-browser não tem esse tipo de problema.
    "expo-web-browser",
    "expo-secure-store",
    [
      "react-native-maps",
      {
        // Mesmo sem Google como mapa base (usamos tiles da Stadia via
        // UrlTile, igual a web), o Android ainda exige essa chave pro
        // componente inicializar — ver README.md.
        androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "",
      },
    ],
  ],
  extra: {
    eas: {
      // Vincula este projeto ao projeto já criado na conta EAS do dono do
      // projeto (`eas build` gerou isso automaticamente na 1ª tentativa, mas
      // não conseguiu escrever sozinho porque este é um app.config.ts
      // dinâmico, não app.json estático — precisou entrar à mão).
      projectId: "a91505b7-8f3e-408a-9350-7df76a2eb3a8",
    },
  },
};

export default config;
