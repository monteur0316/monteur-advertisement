import { drizzle } from "drizzle-orm/libsql"
import { createClient } from "@libsql/client"

function createDrizzleClient() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return drizzle(client)
}

declare const globalThis: {
  drizzleGlobal: ReturnType<typeof createDrizzleClient>
} & typeof global

const db =
  globalThis.drizzleGlobal ?? createDrizzleClient()

if (process.env.NODE_ENV !== "production") {
  globalThis.drizzleGlobal = db
}

export { db }
