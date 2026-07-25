export interface AdminMedia {
  readonly id: string;
  readonly originalFilename: string;
  readonly altText: string;
  readonly caption: string | null;
  readonly width: number;
  readonly height: number;
  readonly visibility: "PRIVATE" | "PUBLIC";
}
export interface AdminProject {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly description: string;
  readonly status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  readonly featured: boolean;
  readonly completedAt: string | null;
  readonly serviceKey: string;
  readonly serviceAreaKey: string;
  readonly seoTitle: string | null;
  readonly seoDescription: string | null;
  readonly version: number;
  readonly updatedAt: string;
  readonly primaryBeforeMedia: AdminMedia | null;
  readonly primaryAfterMedia: AdminMedia | null;
  readonly supportingMedia: readonly {
    readonly id: string;
    readonly category: "BEFORE" | "AFTER" | "GALLERY";
    readonly sortOrder: number;
    readonly caption: string | null;
    readonly media: AdminMedia;
  }[];
}
