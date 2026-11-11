import { registerRootComponent } from 'expo';

import App from './App';
import { reportCrash } from './src/lib/crash-report';

// Temporário (11/11/2026) — captura qualquer erro JS fatal e manda pro
// backend antes de deixar o crash acontecer de verdade, já que a build
// "preview" (sem dev client) não mostra stack trace nenhum na tela. Remover
// depois de achar a causa do crash reportado nessa build.
const errorUtils = (globalThis as any).ErrorUtils;
const defaultHandler = errorUtils?.getGlobalHandler?.();
errorUtils?.setGlobalHandler?.((error: unknown, isFatal?: boolean) => {
  reportCrash('ErrorUtils.globalHandler', error, { isFatal });
  defaultHandler?.(error, isFatal);
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
