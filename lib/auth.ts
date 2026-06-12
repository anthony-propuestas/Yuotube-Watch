import { betterAuth } from "better-auth";
import { D1Dialect } from "kysely-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// Se crea por request: el binding D1 solo está disponible dentro del
// contexto de Cloudflare (getCloudflareContext).
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  return betterAuth({
    database: {
      dialect: new D1Dialect({ database: env.DB }),
      type: "sqlite",
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        // youtube.readonly autoriza el canal en el mismo login
        scope: ["https://www.googleapis.com/auth/youtube.readonly"],
        // offline + consent → Google entrega refresh_token
        accessType: "offline",
        prompt: "select_account consent",
      },
    },
  });
}

export type Auth = Awaited<ReturnType<typeof getAuth>>;
