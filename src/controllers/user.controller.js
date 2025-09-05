import asyncHandlers from "../utils/asyncHandlers.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandlers(async (req,res)=>{
    // get the details from frontend
    // vaildation - not empty
    // Check if the user exsists in DB: username,email
    // Check if the user has an avatar
    // upload the image to cloudinary ,avatar
    // create user object - create entry in db
    // remove password and refreshtoken from response
    // check for user creation 
    // return res


    const {fullName,email,username,password} = req.body;

    if (
        [fullName,email,username,password].some((field)=>{
            field?.trim() === ""
        })
    ) {
        throw new ApiError(400,"All fields are required")
    }

    const existeduser = await User.findOne({
        $or:[{username},{email}]
    })

    if (existeduser) {
        throw new ApiError(409,"User already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    let coverImageLocalPath ;

    if (req.files && Array.isArray(req.files.coverImage && req.files.coverImage.length >0)) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null;

    if (!avatar) {
        throw new ApiError(500,"Could not upload avatar image")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfulyy")
    )
});

export {registerUser}