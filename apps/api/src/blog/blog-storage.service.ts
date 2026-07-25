import { Inject, Injectable } from "@nestjs/common";
import { cp, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";

import { BlogConfigService } from "./blog-config.service";

export type BlogStorageVisibility = "PRIVATE" | "PUBLIC";

@Injectable()
export class BlogStorageService {
  private readonly privateRoot: string;
  private readonly publicRoot: string;

  constructor(@Inject(BlogConfigService) config: BlogConfigService) {
    this.privateRoot = resolve(process.cwd(), config.value.BLOG_LOCAL_PRIVATE_ROOT);
    this.publicRoot = resolve(process.cwd(), config.value.BLOG_LOCAL_PUBLIC_ROOT);
    if (this.privateRoot === this.publicRoot)
      throw new Error("Blog public and private media roots must differ");
  }

  private root(visibility: BlogStorageVisibility) {
    return visibility === "PUBLIC" ? this.publicRoot : this.privateRoot;
  }

  private path(visibility: BlogStorageVisibility, key: string) {
    if (
      !/^[0-9a-f-]{36}\/(?:original|featured|article-large|article-standard|thumbnail)\.webp$/.test(
        key,
      )
    )
      throw new Error("Invalid managed blog-media key");
    const root = this.root(visibility);
    const target = resolve(root, key);
    if (!target.startsWith(`${root}${sep}`)) throw new Error("Blog-media path escaped its root");
    return target;
  }

  async initialize() {
    await Promise.all([
      mkdir(this.privateRoot, { recursive: true }),
      mkdir(this.publicRoot, { recursive: true }),
    ]);
  }

  async write(key: string, data: Buffer) {
    const target = this.path("PRIVATE", key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, data, { flag: "wx" });
  }

  read(visibility: BlogStorageVisibility, key: string) {
    return readFile(this.path(visibility, key));
  }

  async move(mediaId: string, from: BlogStorageVisibility, to: BlogStorageVisibility) {
    if (!/^[0-9a-f-]{36}$/.test(mediaId)) throw new Error("Invalid blog-media identifier");
    const source = resolve(this.root(from), mediaId);
    const target = resolve(this.root(to), mediaId);
    await mkdir(dirname(target), { recursive: true });
    try {
      await rename(source, target);
    } catch {
      await cp(source, target, { recursive: true, errorOnExist: true });
      await rm(source, { recursive: true, force: true });
    }
  }

  async remove(mediaId: string, visibility: BlogStorageVisibility) {
    if (!/^[0-9a-f-]{36}$/.test(mediaId)) throw new Error("Invalid blog-media identifier");
    await rm(resolve(this.root(visibility), mediaId), { recursive: true, force: true });
  }
}
