import {v2 as cloudinary} from "cloudinary"
import fs from "fs"


const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
//   console.log("🌩️ Cloudinary configured:", cloudinary.config());
};

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // console.log("file is uploaded on cloudinary",response.url);

        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.log("cloudinary upload error",error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath)
        }
        return null
    }
}



export {configureCloudinary,uploadOnCloudinary}