import mongoose, { Schema } from "mongoose";

const subscriptionSchema = mongoose.Schema({
    subsciber:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref:'User'
    }
})



export const Subsciption = mongoose.model("Subscription",subscriptionSchema)