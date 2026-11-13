import { auth } from "@/auth";
import { CategoryChips } from "@/components/layout/category-chips";
import { FollowersPanel } from "@/components/layout/followers-panel";
import { GroupsPanel } from "@/components/layout/groups-panel";
import { HeaderVisibility } from "@/components/layout/header-visibility";
import { HudHeader } from "@/components/layout/hud-header";
import { OnboardingDialog } from "@/components/layout/onboarding-dialog";
import { PoiCreateButton } from "@/components/layout/poi-create-button";
import { PoiPanel } from "@/components/layout/poi-panel";
import { ProfilePanel } from "@/components/layout/profile-panel";
import { RouteHistoryPanel } from "@/components/layout/route-history-panel";
import { RoutePanel } from "@/components/layout/route-panel";
import { MapViewLoader } from "@/components/map/map-view-loader";
import { PoiDetailSheet } from "@/components/map/poi-detail-sheet";
import { PoiFormSheet } from "@/components/poi/poi-form-sheet";
import { UserProfileSheet } from "@/components/profile/user-profile-sheet";

export async function AppShell() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // h-svh (não h-dvh): dvh recalcula com o teclado virtual mobile abrindo/
  // fechando, e o Leaflet reage a isso (resize automático da janela) como se
  // o mapa tivesse sido movido de verdade — refazendo a busca de POIs
  // sozinho sem o usuário ter mexido no mapa. svh fica estável nesse caso
  // (só muda em rotação/resize de janela de verdade).
  return (
    // --hud-footer-height: altura total que o rodapé ocupa (barra+FAB no
    // mobile, cluster compacto no desktop) — consumida por `RoutePanel` e
    // pelo indicador "Carregando pontos..." (`map-view.tsx`) pra nunca
    // ficarem escondidos atrás dele. Menor no desktop porque lá o rodapé
    // voltou a ser o cluster compacto de antes (a barra cheia tampava mapa
    // demais numa tela grande — só faz sentido no mobile).
    <div className="relative h-svh w-full overflow-hidden bg-background [--hud-footer-height:6rem] sm:[--hud-footer-height:3.5rem]">
      {/* isolate: contém o stacking context do Leaflet (seus controles internos
          usam z-index até 1000) para que nunca vaze e compita com o HUD abaixo */}
      <div className="absolute inset-0 isolate">
        <MapViewLoader userId={userId} />
      </div>

      <HeaderVisibility>
        <HudHeader userId={userId} />
        <CategoryChips />
      </HeaderVisibility>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* Mobile: barra de navegação full-width + FAB elevado por cima.
            Desktop (sm:): volta a ser o cluster compacto só-ícone de antes,
            ancorado no canto inferior direito — a barra cheia tampava mapa
            demais numa tela grande. */}
        <div className="relative sm:flex sm:flex-row sm:items-end sm:justify-end sm:gap-3">
          <div className="pointer-events-none absolute inset-x-0 -top-[1.125rem] z-10 flex justify-center sm:static sm:inset-auto sm:top-auto sm:z-auto sm:order-first sm:flex-none sm:justify-start">
            <PoiCreateButton />
          </div>

          <div className="pointer-events-auto flex h-16 items-stretch justify-around rounded-2xl border border-border bg-card/80 shadow-lg backdrop-blur-md sm:h-auto sm:w-auto sm:flex-none sm:items-center sm:justify-end sm:gap-3 sm:rounded-none sm:border-none sm:bg-transparent sm:shadow-none sm:backdrop-blur-none">
            <FollowersPanel isAuthenticated={userId !== null} />
            <GroupsPanel isAuthenticated={userId !== null} currentUserId={userId} />
            <RouteHistoryPanel isAuthenticated={userId !== null} />
            <PoiPanel userId={userId} />
          </div>
        </div>
      </div>

      <RoutePanel isAuthenticated={userId !== null} />
      <PoiDetailSheet userId={userId} />
      <PoiFormSheet userId={userId} />
      <UserProfileSheet currentUserId={userId} />
      {/* Sem botão próprio no rodapé (removido ali, ver `profile-panel.tsx`)
          — abre só via avatar do HUD, mas precisa estar montado pra isso. */}
      <ProfilePanel
        isAuthenticated={userId !== null}
        userName={session?.user?.name}
        userAvatarUrl={session?.user?.image}
      />
      {userId && <OnboardingDialog userId={userId} />}
    </div>
  );
}
