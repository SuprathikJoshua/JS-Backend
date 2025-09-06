import asyncHandlers from "../utils/asyncHandlers.js"
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = User.findById(userId);
        const accessToken = user.generateAccessToken; 
        const refreshToken = user.generateRandomToken; 

        user.randomToken = randomToken;
        await user.save({ validateBeforeSave : false })

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong")
    }
}

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

const loginUser = asyncHandlers(async (req,res)=>{
    // req body -> data
    // Email/username - is present in database
    // password - vaildation 
    // access and refresh token 
    // send cookies

    const {email,username,password} = req.body;

    if(!(email || username)){
        throw new ApiError(400,"Username or password is required")
    }

    const user = await User.findOne({
        $or:[{username},{email}]
    })

    if (!user) {
        throw new ApiError(404,"No user found. Please register")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (isPasswordValid) {
        throw new ApiError(401,"Invalid user credentials")
    }

    const {accessToken,refreshToken} = generateAccessAndRefreshTokens(user._id);

    const loggedinUser = await User.findById(user._id);

    const options ={
        httpOnly:true,
        secure:true
    }

    return res.status(200).cookie("accessToken",accessToken).cookie("refreshToken".refreshToken).json(
        new ApiResponse(
            200,
            {
                user:loggedinUser,accessToken,refreshToken,
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandlers (async (req,res)=>{
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    )
    const options ={
        httpOnly:true,
        secure:true
    }
    

    return res.status(200).clearCookie("accessToken").clearCookie("refreshToken").json(new ApiResponse(200,{},"User logged out"))
})

const refreshAccessToken = asyncHandlers(async (req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401,"Invalid refresh Token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
            new ApiResponse(
                200,
                {
                    user:loggedinUser,accessToken,newRefreshToken,
                },
                "Access token refreshed successfully"
            )
        ) 
    } catch (error) {
        throw new ApiError(401,error?.message||"Invalid refresh token")
    }
})

const changePassword = asyncHandlers(async (req,res)=>{
    const {oldPass,newPass} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect= isPasswordCorrect(oldPass);

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid password")
    }

    user.password = newPass;
    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200,"Password updated successfully"))
})

const getCurrentUser = asyncHandlers(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,{},"User fetched successfully"))
})

const updateAvatar = asyncHandlers(async(req,res)=>{
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file missing");
    }

    const avatar = uploadOnCloudinary(avatarLocalPath)

    if (!avatar) {
        throw new ApiError(400,"Error while uploading on cloudinary");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.url}},{new:true}).select("-password");
    return res.status(200).json(new ApiResponse(200,user,"Avatar changed succesfully"))
})

const updateCoverImage = asyncHandlers(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400,"coverImage file missing");
    }

    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage) {
        throw new ApiError(400,"Error while uploading on cloudinary");
    }

    const user = await User.findByIdAndUpdate(req.user?._id,{$set:{coverImage:coverImage.url}},{new:true}).select("-password");
    return res.status(200).json(new ApiResponse(200,user,"Cover Image changed succesfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAvatar,
    updateCoverImage
}