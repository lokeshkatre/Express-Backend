import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const user = req.user;
    const channelId = user._id;

    //fetch total videos
    const totalVideos = await Video.countDocuments({ owner: channelId });

    //fetch total video views
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])

    //Fetch total likes on videos
    const totalLikes = await Like.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails"
            }
        },
        {
            $match: {
                "videoDetails.owner": channelId
            }
        },
        {
            $count: "totalLikes"
        }
    ])

    //total Subscribers
    const totalSubscribers = await Subscription.countDocuments({
        channel: channelId
    })

    const stats = {
        totalVideos,
        totalViews: totalViews[0]?.totalViews || 0,
        totalSubscribers,
        totalLikes: totalLikes[0]?.totalLikes || 0
    }

    return res
        .status(200).json(
            new ApiResponse(200, stats, "Channel stats fetched successfully")
        )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const user = req.user;

    const allVideos = await Video.aggregate([
        {
            $match: {
                owner: user._id
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                allVideos,
                "All channel video fetched"
            )
        )
})

export {
    getChannelStats,
    getChannelVideos
}