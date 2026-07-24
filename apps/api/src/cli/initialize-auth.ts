import { prisma } from "@ctps/database";

import { initializeSystemAccess } from "../auth/system-access";

async function main(): Promise<void> {
  await prisma.$connect();
  await initializeSystemAccess(prisma);
  process.stdout.write("Authentication roles and permissions are initialized.\n");
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Initialization failed."}\n`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
