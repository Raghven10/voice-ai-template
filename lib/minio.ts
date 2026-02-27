
import { Client } from 'minio';

const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
    secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin'
});

export const BUCKET_NAME = process.env.MINIO_BUCKET_NAME || 'kb-documents';

export async function ensureBucketExists(bucketName: string = BUCKET_NAME) {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName, 'us-east-1'); // Region is flexible
            console.log(`Bucket ${bucketName} created successfully`);
        }
    } catch (err) {
        console.error('Error checking/creating bucket', err);
    }
}

export default minioClient;
