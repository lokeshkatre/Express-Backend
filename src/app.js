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

import userRouter from './routes/user.routes.js';

//middleware for router
// the url looks like http://localhost:8000/api/v1/users/xxxxxx  as control goes to userRouter
app.use("/api/v1/users",userRouter);

export { app };