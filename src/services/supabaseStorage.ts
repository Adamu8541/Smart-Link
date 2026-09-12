/**
 * SmartLink Nigeria — Supabase Storage Service
 * Enterprise-grade client storage layer replacing Firebase Cloud Storage.
 */

import { getSupabaseClient } from "./supabaseAuth";

/**
 * Upload a file/blob to Supabase Storage bucket with automated base64 fallback
 */
export async function uploadFileToSupabaseStorage(
  bucketName: string,
  filePath: string,
  file: File | Blob
): Promise<string> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return await fileToBase64(file);
    }

    const cleanPath = filePath.replace(/^\/+/, "");
    const { data, error } = await client.storage
      .from(bucketName)
      .upload(cleanPath, file, { upsert: true });

    if (error) {
      console.warn(`[SupabaseStorage] Upload note (${error.message}), returning data URL fallback`);
      return await fileToBase64(file);
    }

    const { data: publicUrlData } = client.storage.from(bucketName).getPublicUrl(data.path);
    return publicUrlData.publicUrl;
  } catch (err: any) {
    console.warn(`[SupabaseStorage] Upload exception (${err?.message}), using base64 fallback`);
    return await fileToBase64(file);
  }
}

/**
 * Helper to convert File/Blob to base64 Data URL
 */
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Backwards-compatible file upload helper replacing uploadFileToStorage from firebase.ts
 */
export async function uploadFileToStorage(
  storagePath: string,
  file: File | Blob
): Promise<string> {
  return uploadFileToSupabaseStorage("uploads", storagePath, file);
}
