const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const cloudinaryUrl = process.env.CLOUDINARY_URL;
const matches = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
const apiKey = matches[1];
const apiSecret = matches[2];
const cloudName = matches[3];

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('Testing Cloudinary upload...');
// 1x1 pixel transparent PNG buffer
const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
  if (error) {
    console.error('Upload failed:', error);
  } else {
    console.log('Upload succeeded:', result.secure_url);
  }
}).end(buffer);
