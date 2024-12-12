import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken = async (userId)=>{
    try{    
        const user = await User.findById(userId);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        //validateBeforeSave is set false because in userSchema we have set password required true,
        //but we are saving without passing password hence we need to set validateBeforeSave false
        //this will not check any condition and directly save it
        await user.save({
            validateBeforeSave: false
        });

        return {accessToken,refreshToken};

    }catch(error){
        throw new ApiError(500,"Something went wrong while generating access and refresh token");
    }
}


const registerUser = asyncHandler(async (req,res)=>{
    //get user detail from frontend
    const {fullName,email,username,password} = req.body;

    //validation-not empty
    if(
        [fullName,email,username,password].some((field)=> field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required");
    }

    //user already exist:: username, email
    const existedUser = await User.findOne({
        $or: [{ email },{ username }]
    })
    if(existedUser){
        throw new ApiError(409,"User with username or email already exist");
    }

    //check for images  
    //? for optional
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //In above line of code this can give error if we not upload coverImage as
    //in req.files?. coverImage is undefined and we are find path property in undefined
    //to handle this code we are doing following..
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    //check for avatar
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload the image to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Unable to upload Avatar file");
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

const loginUser = asyncHandler(async (req,res)=>{
    //get credential from req.body
    const {username,email,password} = req.body;
    
    //username or email
    if(!username || !email){
        throw new ApiError(400,"username or email is required");
    }

    //find the user
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    //password check
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordCorrect){
        throw new ApiError(401,"Invalid user credentials");
    }

    //access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = User.findById(user._id).select(
        "-password -refreshToken"
    )

    //send cookie
    //option is used so that only server can modify the cookie
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                //we are sending accessToken, refreshToken because user may want to save it to the localStorage
                //or for other purposes
                user: loggedInUser,
                accessToken,
                refreshToken,
            }
        )
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    //find the user from the cookie
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, {}, "User logout successfully"))
})

export {registerUser,loginUser,logoutUser};