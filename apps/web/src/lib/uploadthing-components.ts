// apps/web/src/lib/uploadthing-components.ts
import {
    generateUploadButton,
    generateUploadDropzone,
    generateReactHelpers,
  } from "@uploadthing/react";
  
  import type { OurFileRouter } from "@/lib/uploadthing";
  
  export const UploadButton = generateUploadButton<OurFileRouter>();
  export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
  export const { useUploadThing } = generateReactHelpers<OurFileRouter>();