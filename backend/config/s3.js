const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;

if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
  throw new Error('Missing required AWS env vars: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET');
}

const s3 = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = async (buffer, key, mimetype) => {
  await s3.send(new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));
  return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
};

// S3 DeleteObjectCommand is a no-op for non-existent keys, so safe to call with stale keys
const deleteFromS3 = async (key) => {
  if (!key || key.startsWith('http')) return; // skip legacy Cloudinary URLs in old DB records
  await s3.send(new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: key,
  }));
};

module.exports = { uploadToS3, deleteFromS3 };
