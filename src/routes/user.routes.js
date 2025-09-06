import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {
        name:"coverImage",
        maxCount:1
    }
]),registerUser)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changePassword)

router.route("/get-current-user").post(verifyJWT,getCurrentUser)

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar)

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)

router.route("/channel/:username").get(verifyJWT,getChannelProifle)

router.route("/history").get(verifyJWT,getWatchHistory)


export default router