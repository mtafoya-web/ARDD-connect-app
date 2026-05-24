/**
 * Media service.
 *
 * Backend POST /media/upload accepts a single multipart file (`file`
 * field) and returns `{url, public_id, format, resource_type}`. The
 * storage layer transparently picks Cloudinary or local disk based on
 * env config — callers don't need to know.
 *
 * Note: we deliberately do NOT set Content-Type here. Axios infers
 * `multipart/form-data; boundary=...` from FormData automatically;
 * setting it explicitly used to drop the boundary on some clients.
 */
import client from '../api/client';
import { API_ROUTES } from '../constants/apiRoutes';
import { normalizeMediaUploadResult } from '../lib/normalize';
import type { MediaUploadResult } from '../types';

export class MediaUploadError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'MediaUploadError';
  }
}

export async function uploadMedia(file: File): Promise<MediaUploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await client.post(API_ROUTES.media.upload, form);
  const result = normalizeMediaUploadResult(res.data);
  if (!result) {
    throw new MediaUploadError('Upload succeeded but the server returned no URL');
  }
  return result;
}
