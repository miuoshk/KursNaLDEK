import { isProfileAdmin } from "@/lib/auth/profileAdmin";
import { productRequiresPurchase, type StudyProduct } from "@/features/access/lib/studyAccess";

/** Admin preview kliniki + LDEK kliniczny (jeszcze bez sprzedaży). */
export function shouldBypassPurchaseGate(product: StudyProduct, role: unknown): boolean {
  if (product === "ldek") return true;
  if (product === "ldew" && isProfileAdmin(role)) return true;
  return !productRequiresPurchase(product);
}
