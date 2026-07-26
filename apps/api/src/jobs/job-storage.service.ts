import { Inject, Injectable } from "@nestjs/common";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { JobsConfigService } from "./jobs-config.service";

@Injectable()
export class JobStorageService {
  private readonly root: string;
  constructor(@Inject(JobsConfigService) config: JobsConfigService) {
    this.root = resolve(process.cwd(), config.value.JOBS_PRIVATE_MEDIA_ROOT);
  }
  private path(key: string) {
    if (!/^[0-9a-f-]{36}\/(?:original|large|standard|thumbnail)\.webp$/.test(key))
      throw new Error("Invalid managed job-media key");
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`))
      throw new Error("Job-media path escaped its private root");
    return target;
  }
  initialize() {
    return mkdir(this.root, { recursive: true });
  }
  async write(key: string, data: Buffer) {
    const target = this.path(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data, { flag: "wx" });
  }
  read(key: string) {
    return readFile(this.path(key));
  }
  async remove(mediaId: string) {
    if (!/^[0-9a-f-]{36}$/.test(mediaId)) throw new Error("Invalid job-media identifier");
    await rm(resolve(this.root, mediaId), { recursive: true, force: true });
  }
}
