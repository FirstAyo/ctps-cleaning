import { prisma } from "@ctps/database";
import { displayNameSchema, normalizedEmailSchema, passwordSchema } from "@ctps/validation";

import { createInitialSuperAdmin } from "../auth/initial-super-admin";
import { PasswordService } from "../auth/password.service";
import { initializeSystemAccess } from "../auth/system-access";

async function main(): Promise<void> {
  const { confirm, input, password } = await import("@inquirer/prompts");
  await prisma.$connect();
  await initializeSystemAccess(prisma);

  const email = normalizedEmailSchema.parse(await input({ message: "Super Admin email:" }));
  const displayName = displayNameSchema.parse(await input({ message: "Display name:" }));
  const rawPassword = passwordSchema.parse(
    await password({ message: "Password (12-128 characters):", mask: "*" }),
  );
  const confirmation = await password({ message: "Confirm password:", mask: "*" });
  if (rawPassword !== confirmation) throw new Error("Passwords do not match.");
  const approved = await confirm({
    message: `Create the initial Super Admin for ${email}?`,
    default: false,
  });
  if (!approved) throw new Error("Bootstrap cancelled.");

  await createInitialSuperAdmin(prisma, new PasswordService(), {
    email,
    displayName,
    password: rawPassword,
  });

  process.stdout.write("Initial Super Admin created successfully.\n");
}

void main()
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : "Bootstrap failed."}\n`);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
