import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { createPlaylist,getUserPlaylists,getPlaylistByID,AddVideoToPlaylist, deletePlaylist, updatePlaylist } from "../controllers/playlist.controller";

const router = Router();

router.route("/:username/create-playlist").post(verifyJWT,createPlaylist)

router.route("/:username/playlists").post(verifyJWT,getUserPlaylists)

router.route("/:username/:playlistId").post(verifyJWT,getPlaylistByID)

router.route("/:playlistName/:title/add").post(verifyJWT,AddVideoToPlaylist)

router.route("/:playlistName/:title/delete").post(verifyJWT,deleteVideoFromPlaylist)

router.route("/:name/delete").post(verifyJWT,deletePlaylist)

router.route("/:name/update").post(verifyJWT,updatePlaylist)

export default router