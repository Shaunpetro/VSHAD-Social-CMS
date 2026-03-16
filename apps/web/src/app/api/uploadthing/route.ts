// apps/web/src/app/api/uploadthing/route.ts
import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing";

console.log("=== UPLOADTHING ROUTE LOADED ===");
console.log("Token exists:", !!process.env.UPLOADTHING_TOKEN);
console.log("================================");

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});