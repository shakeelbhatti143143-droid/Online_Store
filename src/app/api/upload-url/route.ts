import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

function isBlockedHostname(hostname: string) {
  const host = hostname.toLowerCase();

  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.')
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const imageUrl = String(body?.url || '').trim();

    if (!imageUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image URL is required.',
        },
        { status: 400 }
      );
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(imageUrl);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid image URL.',
        },
        { status: 400 }
      );
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only HTTP and HTTPS image URLs are supported.',
        },
        { status: 400 }
      );
    }

    if (isBlockedHostname(parsedUrl.hostname)) {
      return NextResponse.json(
        {
          success: false,
          error: 'This image host is not allowed.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(parsedUrl.toString(), {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Unable to download image. Remote server returned ${response.status}.`,
        },
        { status: 400 }
      );
    }

    const contentType =
      response.headers.get('content-type')?.split(';')[0].toLowerCase() || '';

    if (!contentType.startsWith('image/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'The provided URL does not return an image.',
        },
        { status: 400 }
      );
    }

    const contentLength = Number(
      response.headers.get('content-length') || 0
    );

    const MAX_SIZE = 10 * 1024 * 1024;

    if (contentLength > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image must be smaller than 10 MB.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image must be smaller than 10 MB.',
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'online-store/products',
          resource_type: 'image',
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadResult);
          }
        }
      );

      uploadStream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    });
  } catch (error) {
    console.error('External image upload error:', error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to import image.',
      },
      { status: 500 }
    );
  }
}