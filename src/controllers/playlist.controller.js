import mongoose, { isValidObjectId } from "mongoose"
import { Playlist } from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body
    //TODO: create playlist
    const user = req.user;

    if (!name || !description || name.toString().trim() === "" || description.toString().trim() === "") {
        throw new ApiError(400, "All field are required to create playlist");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: user._id
    })

    return res.status(200).json(
        new ApiResponse(
            200,
            playlist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    //TODO: get user playlists
    if (!userId || !isValidObjectId) {
        throw new ApiError(200, "Invalid user ID while getting user playlist");
    }

    const playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        }
    ])

    if (!playlists) {
        throw new ApiError(500, "Something went wrong while fetching playlists")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            playlists,
            "User playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get playlist by id
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    const user = req.user;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id while adding to playlist");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id while adding to playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    //check if playlist exist
    if(!playlist){
        throw new ApiError(404,"Playlist not found while adding to playlist")
    }

    //check if user owns the playlist
    if(!playlist.owner.equals(user._id)){
        throw new ApiError(403,"You are not authorized to add video to this playlist");
    }

    //check if the video already exist in playlist
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400,"Video already exist in the playlist");
    }
    
    //Add video to playlist
    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200,playlist,"Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist
    const user = req.user;

    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id while removing from playlist");
    }

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id while removing from playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    //check if playlist exist
    if(!playlist){
        throw new ApiError(404,"Playlist not found while removing from playlist")
    }

    //check if user owns the playlist
    if(!playlist.owner.equals(user._id)){
        throw new ApiError(403,"You are not authorized to remove video from this playlist");
    }

    // Check if the video is in the playlist
    if (!playlist.videos.some((videoObjectId) => videoObjectId.equals(videoId))) {
        throw new ApiError(400, "Video is not in the playlist");
    }
    
    //Remove video from playlist
    playlist.videos = playlist.videos.filter((videoObjectId)=> !videoObjectId.equals(videoId))
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200,playlist,"Video remove from playlist successfully")
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const user = req.user;
    // TODO: delete playlist
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found while deleting");
    }

    //check if user owns the playlist
    if(!playlist.owner.equals(user._id)){
        throw new ApiError(403,"User is not authorized to delete this playlist");
    }

    await Playlist.findByIdAndDelete(playlistId);

    return res.status(200).json(
        new ApiResponse(200,null,"Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    //TODO: update playlist
    const user = req.user;

    if(!playlistId || !isValidObjectId(playlistId)){
        throw new ApiError(400,"Invalid playlist id while updating playlist")
    }

    if(!name || name.toString().trim()==="" || !description || description.toString().trim()===""){
        throw new ApiError(401,"All fields are required to update playlist");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404,"Playlist not found while updating playlist")
    }

    //check is user is playlist owner
    if(!playlist.owner.equals(user._id)){
        throw new ApiError(403,"Not authorized to update the playlist")
    }
    
    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    return res.status(200).json(
        new ApiResponse(200,newPlaylist,"Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}