import { Injectable } from '@nestjs/common';

@Injectable()
export class MockCloudinaryService {
    async uploadImage(file: Express.Multer.File, folder: string = 'books') {
        console.log(`[MOCK] Would upload image to Cloudinary folder: ${folder}`);
        console.log(`[MOCK] File: ${file.originalname || 'test-file'}, Size: ${file.size} bytes`);

        return {
            secure_url: `https://mock-cloudinary.com/${folder}/mock-image-${Date.now()}.jpg`,
            public_id: `${folder}/mock-image-${Date.now()}`,
            width: 800,
            height: 1200,
            format: 'jpg',
        };
    }

    async deleteImage(publicId: string) {
        console.log(`[MOCK] Would delete image from Cloudinary: ${publicId}`);
        return { result: 'ok' };
    }

    getImageUrl(publicId: string, transformation?: any) {
        console.log(`[MOCK] Getting image URL for: ${publicId}`);
        return `https://mock-cloudinary.com/${publicId}`;
    }
}
