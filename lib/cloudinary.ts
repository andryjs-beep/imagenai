import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export default cloudinary;

/**
 * Sube una imagen desde URL a Cloudinary en la carpeta del usuario
 */
export async function uploadFromUrl(
  imageUrl: string,
  userId: string,
  folder = 'generated'
) {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: `ai-studio/users/${userId}/${folder}`,
    resource_type: 'image',
  });
  return result;
}

/**
 * Sube una imagen desde base64 a Cloudinary en la carpeta del usuario
 */
export async function uploadFromBase64(
  base64Data: string,
  userId: string,
  folder = 'uploads'
) {
  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${base64Data}`,
    {
      folder: `ai-studio/users/${userId}/${folder}`,
      resource_type: 'image',
    }
  );
  return result;
}

/**
 * Elimina una imagen de Cloudinary
 */
export async function deleteImage(publicId: string) {
  return cloudinary.uploader.destroy(publicId);
}
