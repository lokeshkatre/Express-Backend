import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiErrors.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        //In case of mobile application header will be used 
        //autherization Header looks like: Authorization: Bearer <token>   so we need to remove Bearer so we use replace
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401,"Unauthorize request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token")
    }
})