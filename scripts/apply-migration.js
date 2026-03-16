const { config } = require("dotenv")
config({ path: ".env.local" })
const { createClient } = require("@libsql/client")
const fs = require("fs")

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

async function main() {
  const sql = fs.readFileSync("./migrations/0007_lucky_purple_man.sql", "utf8")
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean)

  for (const stmt of statements) {
    console.log("Executing:", stmt.substring(0, 60) + "...")
    await client.execute(stmt)
    console.log("OK")
  }
  console.log("\nAll migrations applied successfully!")
}

main().catch(console.error)
