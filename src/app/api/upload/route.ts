export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get('file');
    const folder = String(formData.get('folder') || 'online-store');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          error: 'No image file provided.',
        },
        { status: 400 }
      );
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only image files are allowed.',
        },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image must be smaller than 10 MB.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try Cloudinary if cloud_name and api_key are provided
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(buffer);
        });

        if (result?.secure_url) {
          return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      } catch (cloudErr) {
        console.warn('Cloudinary upload failed, falling back to local storage:', cloudErr);
      }
    }

    // Fallback: Save locally to public/uploads
    try {
      const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', sanitizedFolder);
      await fs.promises.mkdir(uploadDir, { recursive: true });

      const extension = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${extension}`;
      const filePath = path.join(uploadDir, uniqueName);

      await fs.promises.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${sanitizedFolder}/${uniqueName}`;
      return NextResponse.json({
        success: true,
        url: publicUrl,
        publicId: uniqueName,
      });
    } catch (fsErr) {
      console.warn('Filesystem save failed, falling back to data URL:', fsErr);
      // Absolute fallback: data URL
      const dataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
      return NextResponse.json({
        success: true,
        url: dataUrl,
        publicId: `data-${Date.now()}`,
      });
    }
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image.',
      },
      { status: 500 }
    );
  }
}