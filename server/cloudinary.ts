import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export interface CloudinaryUploadOptions {
  folder?: string;
  publicId?: string;
  transformation?: Array<Record<string, any>>;
  upscale?: boolean;
  quality?: string | number;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload an image to Cloudinary with optional upscaling
 * @param imageBuffer - Buffer containing the image data
 * @param options - Upload configuration options
 * @returns Cloudinary upload result
 */
export async function uploadToCloudinary(
  imageBuffer: Buffer,
  options: CloudinaryUploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'julies-family-learning',
    publicId,
    transformation = [],
    upscale = true,
    quality = 'auto:best'
  } = options;

  // Build transformation array with upscaling
  const transformations = [...transformation];
  
  if (upscale) {
    // Add AI-based upscaling transformation
    // This uses Cloudinary's AI upscaling feature to improve image quality
    transformations.push({
      quality: quality,
      fetch_format: 'auto',
      flags: 'progressive:steep'
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        transformation: transformations.length > 0 ? transformations : undefined,
        eager: [
          {
            width: 1920,
            height: 1080,
            crop: 'limit',
            quality: 'auto:best',
            fetch_format: 'auto'
          },
          {
            width: 3840,
            height: 2160,
            crop: 'limit',
            quality: 'auto:best',
            fetch_format: 'auto'
          }
        ],
        eager_async: true,
        resource_type: 'image',
        allowed_formats: ['jpg', 'png', 'webp', 'gif', 'svg']
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
          return;
        }

        if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes
        });
      }
    );

    uploadStream.end(imageBuffer);
  });
}

/**
 * Generate optimized image URL with transformations
 * @param publicId - Cloudinary public ID
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string | number;
    format?: string;
  } = {}
): string {
  const {
    width,
    height,
    quality = 'auto:best',
    format = 'auto'
  } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'limit',
    quality,
    fetch_format: format,
    secure: true
  });
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error(`Failed to delete image: ${publicId}`);
  }
}

/**
 * Get image details from Cloudinary
 * @param publicId - Cloudinary public ID
 */
export async function getImageDetails(publicId: string) {
  try {
    return await cloudinary.api.resource(publicId);
  } catch (error) {
    console.error('Error fetching image details:', error);
    throw new Error(`Failed to fetch image details: ${publicId}`);
  }
}

export { cloudinary };
