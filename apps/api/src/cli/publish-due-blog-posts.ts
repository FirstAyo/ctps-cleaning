import { createApiApplication } from "../api-application";
import { BlogService } from "../blog/blog.service";

async function main() {
  const created = await createApiApplication();
  try {
    const result = await created.app.get(BlogService).publishDue();
    process.stdout.write(
      `Blog scheduler examined ${result.examined}; published ${result.published}; invalid ${result.invalid}.\n`,
    );
  } finally {
    await created.app.close();
  }
}
void main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : "Blog scheduler failed."}\n`);
  process.exitCode = 1;
});
