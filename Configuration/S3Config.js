// let S3=require('@aws-sdk/client-s3')
// let dotenv=require('dotenv');
// dotenv.config()
// let Bucket_Name=process.env.Bucket_Name;
// let Bucket_Region=process.env.Bucket_Region;
// let Bucket_Access_key=process.env.Bucket_Secret_access_key;
// let Bucket_Secret_access_key=process.env.Bucket_Secret_access_key;

// let s3=new S3.S3Client({
//     credentials:{
//         accessKeyId:Bucket_Access_key,
//         secretAccessKey:Bucket_Secret_access_key
//     },
//     region:Bucket_Region
// });

// s3.checkConnection = async function() {
//     try {
//         await s3.send(new S3.ListBucketsCommand({}));
//         return true;
//     } catch (error) {
//         throw error;
//     }
// };
// module.exports=s3;
// Configuration/S3Config.js

let S3 = require('@aws-sdk/client-s3');
let dotenv = require('dotenv');
dotenv.config();

// Load the environment variables
let Bucket_Region = process.env.Bucket_Region;
let ACCESS_KEY_ID = process.env.Bucket_Access_key;
let SECRET_KEY = process.env.Bucket_Secret_access_key; 

let s3 = new S3.S3Client({
    credentials:{
        // Ensure the ID and Secret are assigned to the correct properties
        accessKeyId: ACCESS_KEY_ID, 
        secretAccessKey: SECRET_KEY
    },
    region: Bucket_Region
});

// Add the connection check method (as discussed in previous steps)
s3.checkConnection = async function() {
    // We use a simple command to verify credentials and network access
    await s3.send(new S3.ListBucketsCommand({}));
    return true;
};

module.exports = s3;