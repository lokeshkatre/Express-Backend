import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    //get user detail from frontend
    const {fullName,email,username,password} = req.body;
    console.log("email: ",email);

    //validation-not empty
    if(
        [fullName,email,username,password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }

    //user already exist:: username, email
    const existedUser = User.findOne({
        $or: [{ email },{ username }]
    })

    if(existedUser){
        throw new ApiError(409,"User with username or email already exist");
    }

    //check for images  
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload the image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is not uploaded on cloudinary");
    }


    //create user object
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token field from response
    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken "
    )

    //check for user creation
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while register the user")
    }

    //return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})


export {registerUser};