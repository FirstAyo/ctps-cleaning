import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import type { Response } from "express";
import {
  authorProfileSchema,
  blogMediaUpdateSchema,
  blogPostListQuerySchema,
  blogPostVersionActionSchema,
  blogSlugSchema,
  blogTagSchema,
  blogTaxonomySchema,
  createBlogPostSchema,
  identifierSchema,
  publicBlogPostListQuerySchema,
  scheduleBlogPostSchema,
  updateBlogPostSchema,
  type AuthorProfileInput,
  type BlogMediaUpdateInput,
  type BlogPostListQuery,
  type BlogTagInput,
  type BlogTaxonomyInput,
  type CreateBlogPostInput,
  type PublicBlogPostListQuery,
  type ScheduleBlogPostInput,
  type UpdateBlogPostInput,
} from "@ctps/validation";

import type { AuthenticatedIdentity } from "../auth/auth.types";
import { CurrentIdentity, PublicRoute } from "../auth/security.decorators";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { BlogMediaService } from "./blog-media.service";
import { BlogService } from "./blog.service";

@Controller()
export class BlogController {
  constructor(@Inject(BlogService) private readonly blog: BlogService) {}

  @Get("admin/blog/posts")
  list(
    @Query(new ZodValidationPipe(blogPostListQuerySchema)) query: BlogPostListQuery,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.list(query, identity);
  }
  @Get("admin/blog/posts/:id")
  get(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.get(id, identity);
  }
  @Post("admin/blog/posts")
  create(
    @Body(new ZodValidationPipe(createBlogPostSchema)) input: CreateBlogPostInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.create(input, identity);
  }
  @Patch("admin/blog/posts/:id")
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(updateBlogPostSchema)) input: UpdateBlogPostInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.update(id, input, identity);
  }
  @Post("admin/blog/posts/:id/publish")
  publish(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogPostVersionActionSchema)) input: { version: number },
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.publish(id, input.version, identity);
  }
  @Post("admin/blog/posts/:id/unpublish")
  unpublish(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogPostVersionActionSchema)) input: { version: number },
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.unpublish(id, input.version, identity);
  }
  @Post("admin/blog/posts/:id/schedule")
  schedule(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(scheduleBlogPostSchema)) input: ScheduleBlogPostInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.schedule(id, input, identity);
  }
  @Post("admin/blog/posts/:id/submit-review")
  review(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogPostVersionActionSchema)) input: { version: number },
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.submitReview(id, input.version, identity);
  }
  @Post("admin/blog/posts/:id/archive")
  archive(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogPostVersionActionSchema)) input: { version: number },
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.archive(id, input.version, identity);
  }
  @Delete("admin/blog/posts/:id")
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.remove(id, identity);
  }
  @Get("admin/blog/posts/:id/preview")
  preview(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.get(id, identity);
  }
  @Get("admin/blog/posts/:id/revisions")
  revisions(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.revisions(id, identity);
  }

  @Get("admin/blog/taxonomy")
  taxonomy() {
    return this.blog.taxonomy();
  }
  @Post("admin/blog/categories")
  createCategory(
    @Body(new ZodValidationPipe(blogTaxonomySchema)) input: BlogTaxonomyInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.manageCategory(null, input, identity);
  }
  @Patch("admin/blog/categories/:id")
  updateCategory(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogTaxonomySchema)) input: BlogTaxonomyInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.manageCategory(id, input, identity);
  }
  @Delete("admin/blog/categories/:id")
  deleteCategory(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.removeCategory(id, identity);
  }
  @Post("admin/blog/tags")
  createTag(
    @Body(new ZodValidationPipe(blogTagSchema)) input: BlogTagInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.manageTag(null, input, identity);
  }
  @Patch("admin/blog/tags/:id")
  updateTag(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogTagSchema)) input: BlogTagInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.manageTag(id, input, identity);
  }
  @Delete("admin/blog/tags/:id")
  deleteTag(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.removeTag(id, identity);
  }
  @Get("admin/blog/authors")
  authors(@CurrentIdentity() identity: AuthenticatedIdentity) {
    return this.blog.authors(identity);
  }
  @Put("admin/blog/authors/:userId")
  updateAuthor(
    @Param("userId", new ZodValidationPipe(identifierSchema)) userId: string,
    @Body(new ZodValidationPipe(authorProfileSchema)) input: AuthorProfileInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.blog.updateAuthor(userId, input, identity);
  }

  @Get("public/blog/posts")
  @PublicRoute()
  publicList(
    @Query(new ZodValidationPipe(publicBlogPostListQuerySchema)) query: PublicBlogPostListQuery,
  ) {
    return this.blog.publicList(query);
  }
  @Get("public/blog/posts/:slug")
  @PublicRoute()
  publicGet(@Param("slug", new ZodValidationPipe(blogSlugSchema)) slug: string) {
    return this.blog.publicGet(slug);
  }
  @Get("public/blog/taxonomy")
  @PublicRoute()
  publicTaxonomy() {
    return this.blog.taxonomy();
  }
  @Get("public/blog/authors/:slug")
  @PublicRoute()
  publicAuthor(@Param("slug", new ZodValidationPipe(blogSlugSchema)) slug: string) {
    return this.blog.publicAuthor(slug);
  }
}

function fileHeaders(
  response: Response,
  file: { mimeType: string; sizeBytes: number; filename: string; cacheControl: string },
) {
  response.setHeader("Content-Type", file.mimeType);
  response.setHeader("Content-Length", String(file.sizeBytes));
  response.setHeader("Content-Disposition", `inline; filename="${file.filename}"`);
  response.setHeader("Cache-Control", file.cacheControl);
  response.setHeader("X-Content-Type-Options", "nosniff");
}

@Controller()
export class BlogMediaController {
  constructor(@Inject(BlogMediaService) private readonly media: BlogMediaService) {}

  @Post("admin/blog/media")
  @UseInterceptors(
    FilesInterceptor("files", 10, { limits: { files: 10, fileSize: 10 * 1024 * 1024 } }),
  )
  upload(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.upload(files ?? [], identity);
  }
  @Patch("admin/blog/media/:id")
  update(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Body(new ZodValidationPipe(blogMediaUpdateSchema)) input: BlogMediaUpdateInput,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.update(id, input, identity);
  }
  @Delete("admin/blog/media/:id")
  remove(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
  ) {
    return this.media.remove(id, identity);
  }
  @Get("admin/blog/media/:id/:variant")
  async privateFile(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("variant") variant: string,
    @CurrentIdentity() identity: AuthenticatedIdentity,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, variant, false, identity);
    fileHeaders(response, file);
    return new StreamableFile(file.data);
  }
  @Get("media/blog/:id/:variant")
  @PublicRoute()
  async publicFile(
    @Param("id", new ZodValidationPipe(identifierSchema)) id: string,
    @Param("variant") variant: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const file = await this.media.file(id, variant, true);
    fileHeaders(response, file);
    return new StreamableFile(file.data);
  }
}
