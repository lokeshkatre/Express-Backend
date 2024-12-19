import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null

        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })

        //file has been uploaded
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        //unlink ->remove the locally saved temporary file as the upload operation got failed
        fs.unlinkSync(localFilePath);
        return null;
    }
}

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) {
            throw new Error("Public ID is required for deletion");
        }

        // Delete the file from Cloudinary
        const response = await cloudinary.uploader.destroy(publicId);

        if (response.result !== "ok" && response.result !== "not found") {
            throw new Error(`Failed to delete from Cloudinary: ${response.result}`);
        }

        return response;
    } catch (error) {
        console.error("Cloudinary deletion error:", error.message);
        return null;
    }
};



// // Function to extract public_id from Cloudinary URL
// const extractPublicId = (imageUrl)=>{
//     const urlParts = imageUrl.split('/');
//     const fileNameWithExtension = urlParts[urlParts.length - 1];
//     const publicId = fileNameWithExtension.split('.')[0];
//     return urlParts.slice(urlParts.length - 3, -1).concat(publicId).join('/');
// }

// //Function to delete file by public_id
// const deleteImageByUrlCloudinary = async (imageUrl)=> {
//     try {
//       const publicId = extractPublicId(imageUrl);
//       const response = await cloudinary.uploader.destroy(publicId);
//       return response;
//     } catch (error) {
//       return null;
//     }
//   }

export { uploadOnCloudinary, deleteFromCloudinary  };