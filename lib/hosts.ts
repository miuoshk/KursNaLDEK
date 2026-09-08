export function isZenitLabsHost(host: string | null | undefined): boolean {
  const name = host?.split(":")[0]?.toLowerCase() ?? "";
  return name === "zenitlabs.pl" || name === "www.zenitlabs.pl";
}
