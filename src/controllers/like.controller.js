import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const user = req.user;
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid video id for like");
    }

    const videoLike = await Like.findOne({
        video: new mongoose.Types.ObjectId(videoId),
        likedBy: user._id
    })

    if(videoLike){
        await Like.findByIdAndDelete(videoLike._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200,null,"Successfully undo the like in video")
        )
    }
    else{
        const like = await Like.create({
            video: new mongoose.Types.ObjectId(videoId),
            likedBy: user._id
        })

        like.save();

        return res
        .status(200)
        .json(
            new ApiResponse(200,like,"Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const user = req.user;
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid video id for like");
    }

    const commentLike = await Like.findOne({
        comment: new mongoose.Types.ObjectId(commentId),
        likedBy: user._id
    })

    if(commentLike){
        await Like.findByIdAndDelete(commentLike._id);
        return res
        .status(200)
        .json(
            new ApiResponse(200,null,"Successfully undo the like in comment")
        )
    }
    else{
        const like = await Like.create({
            comment: new mongoose.Types.ObjectId(commentId),
            likedBy: user._id
        })

        like.save();

        return res
        .status(200)
        .json(
            new ApiResponse(200,like,"Comment liked successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}