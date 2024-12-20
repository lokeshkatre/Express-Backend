import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

//configure the cross-origin resource sharing
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));
//configure the server such that req.body contains the parsed JSON data
app.use(express.json({limit: "16kb"}));
//configure to understand the encoded url
app.use(express.urlencoded({
    extended: true,  //pass object inside object
    limit: "16kb"
}))
//configure to automatically lets the browser access files from a specific folder here it is public folder
app.use(express.static("public"));
//configure server to crud(create , read , update, delete) the cookies
app.use(cookieParser());


//ROUTES IMPORT

import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import subscriptionRouter from "./routes/subscriptionRouter.routes.js"
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import healthCheckRouter from "./routes/healthcheck.routes.js"
import likeRouter from "./routes/like.routes.js";
import tweetRouter from "./routes/tweet.routes.js"
import playlistRouter from "./routes/playlist.routes.js"

//middleware for router
// the url looks like http://localhost:8000/api/v1/users/xxxxxx  as control goes to userRouter
app.use("/api/v1/users",userRouter);
app.use("/api/v1/videos",videoRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/dashboard",dashboardRouter);
app.use("/api/v1/healthcheck",healthCheckRouter);
app.use("/api/v1/likes",likeRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/playlists",playlistRouter);

export { app };