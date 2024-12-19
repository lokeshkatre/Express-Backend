import mongoose, { isValidObjectId } from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id for comments list");
    }

    //convert page and limit to numbers
    const skip = (page - 1) * limit;
    const parsedLimit = parseInt(limit);

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: { createdAt: -1 } // Sort by createdAt in descending order (latest first)
        },
        {
            $skip: skip
        },
        {
            $limit: parsedLimit
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        {
            $unwind: "$userDetails"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                "userDetails.username": 1,
                "userDetails.avatar": 1
            }
        },
        {
            $facet: {
                commentList: [
                    {
                        $project: {
                            content: 1,
                            createdAt: 1,
                            "userDetails.username": 1,
                            "userDetails.avatar": 1
                        }
                    }
                ],
                totalComments: [
                    { $count: "total" }
                ]
            }
        },
        {
            $project: {
                commentList: 1,
                totalComments: { $arrayElemAt: ["$totalComments.total", 0] }
            }
        }
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comments,
                "Comments fetched successfully"
            )
        )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;
    const user = req.user;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id for commenting")
    }

    if (content.trim() === "") {
        throw new ApiError(400, "Content is required for the comment");
    }


    const comment = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(videoId),
        owner: user._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                comment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const user = req.user;
    const { content } = req.body;
    const { commentId } = req.params;

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid video id for updating comment")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found while updating comment");
    }

    if(comment.owner.toString()!==user._id.toString()){
        throw new ApiError(401,"Unauthorize request to update comment")
    }


    if (content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty")
    }

    const newComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                newComment,
                "comment updated successfully"
            )
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    const user = req.user;

    if (!commentId || !isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const comment = await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(404,"Comment not found while deleting comment");
    }

    if(comment.owner.toString()!==user._id.toString()){
        throw new ApiError(401,"Unauthorize request to delete comment")
    }

    await Comment.deleteOne({
        _id: new mongoose.Types.ObjectId(commentId)
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            null,
            "comment deleted successfully"
        )
    )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}