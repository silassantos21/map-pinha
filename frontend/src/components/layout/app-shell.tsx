import { auth } from "@/auth";
import { CategoryChips } from "@/components/layout/category-chips";
import { FavoritesPanel } from "@/components/layout/favorites-panel";
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

export async function AppShell() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  // h-svh (não h-dvh): dvh recalcula com o teclado virtual mobile abrindo/
  // fechando, e o Leaflet reage a isso (resize automático da janela) como se
  // o mapa tivesse sido movido de verdade — refazendo a busca de POIs
  // sozinho sem o usuário ter mexido no mapa. svh fica estável nesse caso
  // (só muda em rotação/resize de janela de verdade).
  return (
    <div className="relative h-svh w-full overflow-hidden bg-background">
      {/* isolate: contém o stacking context do Leaflet (seus controles internos
          usam z-index até 1000) para que nunca vaze e compita com o HUD abaixo */}
      <div className="absolute inset-0 isolate">
        <MapViewLoader userId={userId} />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex flex-col gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <HudHeader userId={userId} />
        <CategoryChips />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-end gap-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <PoiCreateButton />
        <FavoritesPanel isAuthenticated={userId !== null} />
        <ProfilePanel
          isAuthenticated={userId !== null}
          userName={session?.user?.name}
          userAvatarUrl={session?.user?.image}
        />
        <RouteHistoryPanel isAuthenticated={userId !== null} />
        <PoiPanel userId={userId} />
      </div>

      <RoutePanel isAuthenticated={userId !== null} />
      <PoiDetailSheet userId={userId} />
      <PoiFormSheet userId={userId} />
      {userId && <OnboardingDialog userId={userId} />}
    </div>
  );
}
