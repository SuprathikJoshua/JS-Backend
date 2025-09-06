import asyncHandler from "../utils/asyncHandlers";
import { Playlist } from "../models/playlist.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { Video } from "../models/video.model";

const createPlaylist = asyncHandler(async (req , res)=>{
    // inputting the information given by user 
    // Verifying if all fields are given 
    // Checking if there is an existing playlist by name 
    // Create a playlist 
    // Checking if a playlist is created
    // update the user playlist count  
    // returning a status and response 
    const {name,description} = req.body;

    if (!name||!description) {
        throw new ApiError(400,"name and description are required")
    }

    const existingPlaylist = await Playlist.findOne({name})

    if (existingPlaylist) {
        throw new ApiError(400,"Playlist name already used. Please select another name.")
    }

    const playlist = await Playlist.create({
        name,
        description
    })

    if (!playlist) {
        throw new ApiError(500,"Something went wrong while creating playlist")
    }

    const user = await User.findById(req.user?._id);

    user.playlist.push(playlist._id);
    user = await user.save({validateBeforeSave:false}).select("-password")//not sure may get error be careful

    return res.status(200).json(new ApiResponse(200,user,"Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req,res)=>{
    const {username} = req.params;

    const user = await User.findOne({username}).populate("playlists")

    res.status(200).json(new ApiResponse(200,user.playlist,"User playlists fetched"))
})

const getPlaylistByID = asyncHandler(async (req,res)=>{
    const {playlistId} = req.params;

    const user = await Playlist.findById(playlistId);

    if (!user) {
        throw new ApiError(400,"Playlist doesn't exist")
    }

    res.status(200).json(200,user,"Playlist fetched successfully")

})

const AddVideoToPlaylist = asyncHandler(async (req,res)=>{
    // Get video title from user and extract the video id and the user id of the video
    // check if the userid from the video matches the logged in user id 
    // Add the video to the playlist

    const {playlistName,title} = req.params;
    const playlist = await Playlist.findOne({name:playlistName})

    if (!playlist) {
        throw new ApiError(400,"Playlist doesn't exist. Please create a playlist to add the video")
    }
    const video = await Video.findOne({title}).populate("owner");

    if (!video) {
        throw new ApiError(400,"Video not found")
    }
    const videoId = video?._id
    const ownerId = video.owner?._id;

    if (!ownerId) {
        throw new ApiError(500,"Owner not found")
    }

    if (ownerId.toString() !== req.user._id.toString()) {
        throw new ApiError(400,"You can only add your own videos to your channel playlist")
    }

    playlist.videos.push(videoId)
    playlist = await playlist.save({validateBeforeSave:true});

    return res.status(200).json(new ApiResponse(200,playlist,"Videos added succesfully"))
})

const deleteVideoFromPlaylist = asyncHandler(async (req,res)=>{
    const {playlistName,title} = req.params;
    const playlist = await Playlist.findOne({name:playlistName}).populate("videos")
    const videoId = playlist.videos?._id

    const givenVideo = await Video.findOne({title})
    if (!givenVideo) {
        throw new ApiError(400,"Requested Video not found")
    }
    const givenVideoId = givenVideo?._id

    if (videoId.toString() !== givenVideo.toString()) {
        throw new ApiError(400,"Requested video not available in playlist")
    }

    playlist = await Playlist.findByIdAndUpdate(playlist._id,
        {$pull:{videos:givenVideoId}},
        {new:true}
    )

    return res.status(200).json(200,playlist,"Video deleted from playlist")
})

const deletePlaylist = asyncHandler(async (req,res)=>{
    const {name} = req.params;

    const playlist = await Playlist.findOne({name});

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only delete your own playlists");
    }

     await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    );
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { name } = req.params;             
  const { newName, description } = req.body;

  if (!newName && !description) {
    throw new ApiError(400, "At least one of newName or description must be provided");
  }

  const playlist = await Playlist.findOne({ name });
  if (!playlist) throw new ApiError(404, "Playlist not found");

  if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only update your own playlists");
  }

  if (newName) {
    const existing = await Playlist.findOne({ name: newName });
    if (existing && existing._id.toString() !== playlist._id.toString()) {
      throw new ApiError(400, "Playlist name already used");
    }
    playlist.name = newName;
  }

  if (description) playlist.description = description;

  await playlist.save();

  return res.status(200).json(
    new ApiResponse(200,playlist,"Playlist deleted succesfully")
  );
});


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistByID,
    AddVideoToPlaylist,
    deleteVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}