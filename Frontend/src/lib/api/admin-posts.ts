import { deleteJson, postFormData, postJson, putJson } from "@/lib/api/client";

export const POST_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export type CreateAdminPostInput = {
  title: string;
  excerpt: string;
  content: string;
  slug?: string;
  status?: PostStatus;
  category?: string;
  tags?: string[];
  coverImageUrl?: string;
  galleryImages?: string[];
  videoUrls?: string[];
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  noIndex?: boolean;
  relatedTournament?: string;
  relatedEvent?: string;
};

export type UpdateAdminPostInput = Partial<CreateAdminPostInput>;

export type AdminPostResponse = {
  ok: boolean;
  data: {
    _id?: string;
    slug?: string;
    title?: string;
    excerpt?: string;
    content?: string;
    status?: string;
    category?: string;
    tags?: string[];
    coverImageUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    publishedAt?: string;
  };
};

export type DeleteAdminPostResponse = { ok: boolean };

export type UploadPostImageResponse = {
  ok: boolean;
  data: { url: string; publicId?: string };
};

export async function uploadPostImage(file: File, name?: string): Promise<UploadPostImageResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "billar-en-linea/noticias");
  if (name && name.trim().length > 0) {
    formData.append(
      "publicId",
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }
  formData.append("tags", "noticias,admin,frontend-lab");
  return postFormData<UploadPostImageResponse>("/api/admin/uploads/images", formData, {
    credentials: "include",
  });
}

export async function createPostAdmin(input: CreateAdminPostInput) {
  return postJson<AdminPostResponse, CreateAdminPostInput>("/api/posts", input, {
    credentials: "include",
  });
}

export async function updatePostAdmin(postId: string, input: UpdateAdminPostInput) {
  return putJson<AdminPostResponse, UpdateAdminPostInput>(`/api/posts/${postId}`, input, {
    credentials: "include",
  });
}

export async function deletePostAdmin(postId: string) {
  return deleteJson<DeleteAdminPostResponse>(`/api/posts/${postId}`, {
    credentials: "include",
  });
}
