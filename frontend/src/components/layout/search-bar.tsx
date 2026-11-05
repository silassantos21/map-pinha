"use client";

import { MapPin, Search, Signpost, X } from "lucide-react";
import { useState } from "react";

import { useAddressSearch } from "@/hooks/use-address-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePoiSearch } from "@/hooks/use-poi-search";
import { useMapStore } from "@/stores/map-store";
import type { AddressResult, Poi } from "@/types/poi";

interface SearchBarProps {
  userId?: string | null;
}

/** Busca unificada (Fase 8): POIs já cadastrados (`usePoiSearch`) e
 * endereços/lugares genéricos via Nominatim (`useAddressSearch`) na mesma
 * lista, diferenciados por ícone. Selecionar um POI abre o card de detalhe
 * (comportamento já existente); selecionar um endereço só voa o mapa até lá
 * (`flyToPoi`), sem criar POI nem abrir formulário nenhum.
 *
 * No mobile a pill vira um botão (não um input editável) que abre um painel
 * de tela cheia com o campo de verdade — o dropdown flutuante original ficava
 * espremido em cima dos chips de categoria numa tela pequena. O painel só
 * fecha pelo X ou escolhendo um resultado, nunca por perda de foco (o teclado
 * soma sozinho ao rolar a lista de resultados, por exemplo, e isso não deveria
 * fechar o painel). */
export function SearchBar({ userId }: SearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const flyToPoi = useMapStore((s) => s.flyToPoi);
  const mapBounds = useMapStore((s) => s.mapBounds);

  const debouncedQuery = useDebouncedValue(inputValue, 300);
  // `isOpen` entra no `enabled` dos dois hooks além do tamanho da query: sem
  // isso, fechar a busca não parava as requisições — o painel some da tela,
  // mas a query continua "enabled" (só olha o texto digitado) e qualquer
  // mudança de `mapBounds` depois (inclusive uma mudança de viewport sem
  // relação nenhuma com o usuário mexer no mapa, como o teclado abrindo/
  // fechando — ver `app-shell.tsx`) disparava a busca de novo, escondida.
  const { data: poiResults = [] } = usePoiSearch(debouncedQuery, userId, isOpen);
  const { data: addressResults = [] } = useAddressSearch(debouncedQuery, mapBounds, isOpen);

  const hasQuery = debouncedQuery.trim().length >= 2;
  const hasResults = poiResults.length > 0 || addressResults.length > 0;

  const close = () => setIsOpen(false);

  const selectPoi = (poi: Poi) => {
    flyToPoi({ id: poi.id, lat: poi.lat, lng: poi.lng });
    setInputValue(poi.name);
    close();
  };

  const selectAddress = (result: AddressResult) => {
    flyToPoi({ id: `address:${result.lat},${result.lng}`, lat: result.lat, lng: result.lng });
    setInputValue(result.address);
    close();
  };

  const resultsList = (
    <>
      {poiResults.map((poi) => (
        <button
          key={poi.id}
          type="button"
          onClick={() => selectPoi(poi)}
          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
        >
          <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <span className="flex min-w-0 flex-col items-start">
            <span className="text-sm text-foreground">{poi.name}</span>
            {poi.address && (
              <span className="truncate text-xs text-muted-foreground">{poi.address}</span>
            )}
          </span>
        </button>
      ))}
      {addressResults.map((result, index) => (
        <button
          key={`${result.lat},${result.lng},${index}`}
          type="button"
          onClick={() => selectAddress(result)}
          className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-muted"
        >
          <Signpost className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-foreground">{result.address}</span>
        </button>
      ))}
    </>
  );

  if (isMobile) {
    return (
      <>
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Buscar POIs ou endereços"
            className="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur-md"
          >
            <Search className="size-4" />
          </button>
        </div>

        {isOpen && (
          // pointer-events-auto é essencial aqui: o <header> inteiro (ver
          // `hud-header.tsx`) tem pointer-events-none, e cada elemento
          // clicável precisa reativar explicitamente. Sem isso, os toques
          // neste painel (incluindo o X de fechar) atravessavam pra quem
          // estava por baixo na mesma posição de tela — no caso do X, o
          // botão de logout do AuthButton, que fica no canto superior
          // direito igual o X. Era isso que disparava o `signOut` escondido
          // e "recarregava a página inteira" ao tentar fechar a busca.
          <div className="pointer-events-auto fixed inset-0 z-50 flex flex-col bg-background">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                type="text"
                name="poi-search"
                id="poi-search"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Buscar POIs ou endereços..."
                className="min-w-0 flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Fechar busca"
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5">
              {!hasQuery ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Digite pelo menos 2 caracteres para buscar.
                </p>
              ) : !hasResults ? (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Nenhum resultado encontrado.
                </p>
              ) : (
                resultsList
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="relative min-w-0 flex-1">
      <div className="pointer-events-auto flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-2 backdrop-blur-md sm:gap-2 sm:px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          name="poi-search"
          id="poi-search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder="Buscar POIs ou endereços..."
          className="w-full min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      {isOpen && hasQuery && (
        <div className="pointer-events-auto absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur-md">
          {!hasResults ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum resultado encontrado.</p>
          ) : (
            resultsList
          )}
        </div>
      )}
    </div>
  );
}
