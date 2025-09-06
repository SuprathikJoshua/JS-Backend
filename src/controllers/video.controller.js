import { Video } from "../models/video.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandlers";
import { uploadOnCloudinary } from "../utils/cloudinary";

const publishVideo = asyncHandler(async (req,res)=>{
    const {title,description,duration} = req.body;

    if (
        [title,description,duration].some((field)=>{
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath) {
        throw new ApiError(400,"Video file is not required")
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400,"Thumbnail is not required")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile) {
        throw new ApiError(400,"Video file upload failed")
    }
    if (!thumbnail) {
        throw new ApiError(400,"Thumbnail upload failed")
    }
    const video = await Video.create({
        videoFile,
        thumbnail,
        title,
        description,
        duration,
        owner:req.user?._id
    })

    if (!video) {
        throw new ApiError(500,"Video publishment failed")
    }

    return res.status(200).json(new ApiResponse(200,video,"Video published successfully"))
})

export {publishVideo}