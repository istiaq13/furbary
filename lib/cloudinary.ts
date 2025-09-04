import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: 'duxajckwh',
  api_key: '576684753251999',
  api_secret: 'pd406-U-1zYWSubxYGetjzcB92A',
});

export const uploadImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default'); 

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/duxajckwh/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default cloudinary;