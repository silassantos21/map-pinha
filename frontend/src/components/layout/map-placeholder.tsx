export function MapPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary">
      <p className="font-display text-xs tracking-wide text-muted-foreground">
        Carregando mapa...
      </p>
    </div>
  );
}
