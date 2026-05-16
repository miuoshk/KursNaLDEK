import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripeServerClient() {
  if (stripeClient) return stripeClient;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Brak STRIPE_SECRET_KEY w zmiennych środowiskowych.");
  }

  stripeClient = new Stripe(secretKey);
  return stripeClient;
}
