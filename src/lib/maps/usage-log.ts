export type MapsApiKind = "autocomplete" | "geocode" | "reverse_geocode";

export function logMapsUsage(kind: MapsApiKind, meta?: Record<string, unknown>) {
  const line = `[maps:${kind}]${meta ? ` ${JSON.stringify(meta)}` : ""}`;
  console.info(line);
}
