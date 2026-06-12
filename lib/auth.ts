import { betterAuth } from "better-auth";
import { D1Dialect } from "kysely-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Se crea por request: el binding D1 solo está disponible dentro del
// contexto de Cloudflare (getCloudflareContext).
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  // Strip UTF-8 BOM (U+FEFF) that PowerShell may inject into wrangler secrets
  // Strip UTF-8 BOM (U+FEFF) that PowerShell injects into wrangler secrets.
  // Must mutate process.env so Better Auth reads the clean value internally.
  if (process.env.BETTER_AUTH_URL?.charCodeAt(0) === 0xFEFF) {
    process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL.slice(1);
  }
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        scope: ["https://www.googleapis.com/auth/youtube.readonly"],
        accessType: "offline",
        prompt: "select_account consent",
      },
    },
  });
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
