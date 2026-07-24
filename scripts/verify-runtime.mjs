import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const processes = [];
const expectDatabaseUnavailable = process.argv.includes("--expect-database-unavailable");

function startProcess(command, args, cwd, environment = {}) {
  const output = [];
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, NODE_ENV: "production", ...environment },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => output.push(chunk.toString()));
  child.stderr.on("data", (chunk) => output.push(chunk.toString()));
  processes.push({ child, output });
  return child;
}

async function waitForResponse(url, acceptedStatuses = [200], timeoutMilliseconds = 40_000) {
  const deadline = Date.now() + timeoutMilliseconds;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });
      if (acceptedStatuses.includes(response.status)) return response;
    } catch {
      // A short connection failure is expected while the process starts.
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

async function stopProcesses() {
  for (const { child } of processes.reverse()) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }

  await Promise.all(
    processes.map(
      ({ child }) =>
        new Promise((resolve) => {
          if (child.exitCode !== null) return resolve();
          child.once("exit", resolve);
          setTimeout(resolve, 3_000);
        }),
    ),
  );
}

function reportProcessOutput() {
  for (const { output } of processes) {
    if (output.length > 0) {
      console.error(output.join("").slice(-4_000));
    }
  }
}

try {
  startProcess(process.execPath, ["dist/main.js"], path.join(root, "apps/api"), {
    NODE_ENV: "development",
  });
  const healthResponse = await waitForResponse("http://127.0.0.1:4000/health");
  const databaseResponse = await waitForResponse(
    "http://127.0.0.1:4000/health/database",
    expectDatabaseUnavailable ? [503] : [200],
  );
  const health = await healthResponse.json();
  const database = await databaseResponse.json();

  if (expectDatabaseUnavailable) {
    console.log(JSON.stringify({ api: health, database }, null, 2));
    if (
      health.status !== "ok" ||
      database.status !== "unavailable" ||
      database.database !== "unavailable"
    ) {
      throw new Error("Database outage did not produce the expected safe readiness response");
    }
  } else {
    const nextBin = path.join("node_modules", "next", "dist", "bin", "next");
    startProcess(
      process.execPath,
      [nextBin, "start", "--port", "3000"],
      path.join(root, "apps/web"),
    );
    startProcess(
      process.execPath,
      [nextBin, "start", "--port", "3001"],
      path.join(root, "apps/admin"),
    );

    const webResponse = await waitForResponse("http://127.0.0.1:3000");
    const adminResponse = await waitForResponse("http://127.0.0.1:3001");
    const webHtml = await webResponse.text();
    const adminHtml = await adminResponse.text();

    const result = {
      admin: {
        staffLogin: adminHtml.includes("Staff sign in"),
        status: adminResponse.status,
      },
      api: health,
      database,
      web: {
        apiReady: webHtml.includes("API reachable"),
        foundationPage: webHtml.includes("Premium public design foundation"),
        status: webResponse.status,
      },
    };

    console.log(JSON.stringify(result, null, 2));

    if (!result.admin.staffLogin || !result.web.apiReady || !result.web.foundationPage) {
      throw new Error("A foundation page did not render its expected safe status content");
    }
  }
} catch (error) {
  reportProcessOutput();
  console.error(error instanceof Error ? error.message : "Runtime verification failed");
  process.exitCode = 1;
} finally {
  await stopProcesses();
}
