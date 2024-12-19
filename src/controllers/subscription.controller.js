import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { count } from "console"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    const user = req.user;
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    // Check if the subscription exists
    const existingSubscription = await Subscription.findOne({
        channel: new mongoose.Types.ObjectId(channelId),
        subscriber: new mongoose.Types.ObjectId(user._id),
    });

    if (existingSubscription) {
        await Subscription.deleteOne({ _id: existingSubscription._id });

        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Successfully unsubscribed from the channel")
            )
    }
    else {
        const newSubscription = await Subscription.create({
            channel: new mongoose.Types.ObjectId(channelId),
            subscriber: new mongoose.Types.ObjectId(user._id)
        })

        await newSubscription.save();

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    newSubscription,
                    "Successfully subcribed the channel"
                )
            )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channelId");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriberDetails",
            },
        },
        {
            $facet: {
                subscriberList: [
                    {
                        $project: {
                            subscriberDetails: {
                                _id: 1,
                                username: 1,
                                email: 1,
                                fullName: 1,
                                avatar: 1,
                                coverImage: 1,
                            },
                        },
                    },
                ],
                totalSubscribers: [
                    { $count: "total" },
                ],
            },
        },
        {
            $project: {
                subscriberList: 1,
                totalSubscribers: { $arrayElemAt: ["$totalSubscribers.total", 0] },
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Get all the subscribers successfully"
            )
        )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if(!subscriberId || !isValidObjectId(subscriberId)){
        throw new ApiError(400,"Invalid subscriber Id");
    }
    const user = req.user;
    const subscriberObjectId = new mongoose.Types.ObjectId(subscriberId);

    if(subscriberObjectId.toString() !== user._id.toString()){
        throw new ApiError(401,"Unauthorized request");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: subscriberObjectId
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannelDetail"
            }
        },
        {
            $facet: {
                SubscribedChannelList: [
                    {
                        $project: {
                            subscribedChannelDetail: {
                                _id: 1,
                                username: 1,
                                email: 1,
                                fullName: 1,
                                avatar: 1,
                                coverImage: 1
                            }
                        }
                    }
                ],
                totalSubscribedChannels: [
                    { $count: "total" },
                ]
            }
        },
        {
            $project: {
                SubscribedChannelList: 1,
                totalSubscribedChannels: { $arrayElemAt: ["$totalSubscribedChannels.total", 0] }
            }
        }
    ]);

    return  res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscribedChannels,
            "Fetched subscribed channel list successfully"
        )
    )

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}