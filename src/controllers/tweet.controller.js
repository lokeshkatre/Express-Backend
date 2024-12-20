import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const user = req.user;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "content is required for the tweet");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: user._id
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params;

    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user Id while getting tweets")
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(404,"User not found while getting tweets");
    }

    const tweetList = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    return res.
    status(200)
    .json(
        new ApiResponse(200,tweetList,"User tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params;
    const {content} = req.body;
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet Id while updating");
    }

    if(!content || content.trim()===""){
        throw new ApiError(400,"Content is required for updating tweet");
    }

    const user = req.user;
    const tweet = await Tweet.findById(tweetId);
    if(tweet.owner.toString()!==user._id.toString()){
        throw new ApiError(401,"Unauthorized request while updating tweet");
    }

    const newTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        }
    )

    return res.
    status(200)
    .json(
        new ApiResponse(200,newTweet,"Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params;
   
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweet Id while deleting");
    }

    const user = req.user;
    const tweet = await Tweet.findById(tweetId);
    if(tweet.owner.toString()!==user._id.toString()){
        throw new ApiError(401,"Unauthorized request while deleting tweet");
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.
    status(200)
    .json(
        new ApiResponse(200,null,"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}