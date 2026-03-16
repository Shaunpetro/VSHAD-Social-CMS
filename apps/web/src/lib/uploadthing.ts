// apps/web/src/lib/uploadthing.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  mediaUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 10 },
    video: { maxFileSize: "64MB", maxFileCount: 4 },
  })
    .middleware(async ({ req }) => {
      console.log("Uploadthing middleware - request received");
      return { userId: "temp-user-001" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("=== UPLOAD COMPLETE ===");
      console.log("User ID:", metadata.userId);
      console.log("File URL:", file.url);
      console.log("File Name:", file.name);
      console.log("=======================");
      return { url: file.url, name: file.name };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;