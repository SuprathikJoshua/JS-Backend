import asyncHandlers from "../utils/asyncHandlers.js"

const registerUser = asyncHandlers(async (req,res)=>{
    res.status(200).json({
        message:"Lucky you did it!!"
    })
})

export {registerUser}