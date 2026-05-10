import { db } from "./lib/db";

async function main() {
  await db.user.updateMany({
    data: { role: "ADMIN" },
  });
  console.log("Updated all users to ADMIN");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => process.exit(0));
