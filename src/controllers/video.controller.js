import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiErrors.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "descending", userId } = req.query;

    // Validate inputs
    const validSortFields = ["title", "views", "createdAt"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortType === "ascending" ? 1 : -1;

    // Construct regex for query search
    const keyWords = query?.split(" ").join("|");
    const regex = query ? new RegExp(keyWords, "i") : null;

    // Build aggregation pipeline
    const pipeline = [
        {
            $match: {
                ...(userId && { owner: new mongoose.Types.ObjectId(userId) }), // Correctly instantiate ObjectId
                ...(query && { title: { $regex: regex } }),
                isPublished: true,
            },
        },
        {
            $sort: {
                [sortField]: sortDirection,
            },
        },
        {
            $skip: (page - 1) * Number(limit),
        },
        {
            $limit: Number(limit),
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
            },
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    $arrayElemAt: ["$ownerDetails", 0],
                },
            },
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                views: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1,
                owner: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                },
            },
        },
    ];

    try {
        // Execute the aggregation pipeline
        const filteredVideos = await Video.aggregate(pipeline);

        // Count total matching documents for pagination metadata
        const totalPipeline = [
            {
                $match: {
                    ...(userId && { owner: new mongoose.Types.ObjectId(userId) }),
                    ...(query && { title: { $regex: regex } }),
                },
            },
            {
                $count: "total",
            },
        ];

        const totalResults = await Video.aggregate(totalPipeline);
        const total = totalResults.length > 0 ? totalResults[0].total : 0;

        // Return response
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    filteredVideos,
                    pagination: {
                        total,
                        currentPage: Number(page),
                        totalPages: Math.ceil(total / limit),
                    },
                },
                "Videos Fetched Successfully"
            )
        );
    } catch (error) {
        throw new ApiError(401, error?.message || "Unable to fetch the videos");
    }
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    // TODO: get video, upload to cloudinary, create video
    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if (!videoFileLocalPath || !thumbnailLocalPath || !title || !description) {
        throw new ApiError(400, "All fields are required");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "Unable to upload the file");
    }

    const user = req.user;

    if (!user) {
        throw new ApiError(400, "Unauthorized request to Upload video");
    }
    //create video object
    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: user?._id
    })

    if (!video) {
        throw new ApiError(500, "Something went wrong while uploading video");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video is published successFully"
            )
        )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Fetch the video by ID
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Return response
    return res.status(200).json(
        new ApiResponse(
            200,
            video,
            "Video fetched successfully"
        )
    );
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const thumbnailLocalPath = req.file?.path;
    const {title,description} = req.body;
    //TODO: update video details like title, description, thumbnail
    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Video path not Available")
    }

    const video = await Video.findById(videoId);
    const user = req?.user;

    if(!video){
        throw new ApiError(404,"Video not Found");
    }

    // Only the owner is allowed to update
    if (user._id.toString() !== video.owner.toString()) {
        throw new ApiError(401, "Unauthorized request while updating video");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnail.url) {
        throw new ApiError(400, "Error while Uploading New thumbnail Image");
    }

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail : thumbnail.url,
                title,
                description
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
            newVideo,
            "Video thumbnail updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video ID")
    }

    const user = req?.user;
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found");
    }

    if(user._id.toString()!==video.owner.toString()){
        throw new ApiError(401,"Unauthorized request to delete video");
    }

    //delete the video
    const cloudinaryPublicId = video.thumbnail.split("/").pop().split(".")[0];

    if(!cloudinaryPublicId){
        throw new ApiError(400,"Unable to find the cloudinary Public Id");
    }

    try {
        // Delete the video thumbnail from Cloudinary
        console.log(cloudinaryPublicId);
        deleteFromCloudinary(cloudinaryPublicId);

        // Delete the video record from the database
        await Video.findByIdAndDelete(videoId);

        return res.status(200).json(
            new ApiResponse(
                200,
                null,
                "Video deleted successfully"
            )
        );
    } catch (error) {
        throw new ApiError(500, "Failed to delete video from Cloudinary or database");
    }

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid Vidoe ID");
    }

    const user = req.user;
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not Found");
    }

    if(user._id.toString() !== video.owner.toString()){
        throw new ApiError(401,"Unauthorized request to toggle Pulish Status");
    }

    const isPublished = !video.isPublished;

    const newVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished
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
            newVideo,
            "Toggled Publish Status of video successfully"
        )
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}