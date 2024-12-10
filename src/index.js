import dotenv from "dotenv";
//we add -r dotenv/config --experimental-json-modules in script in package.json to enable dotenv

import connectDB from "./db/index.js";

dotenv.config({
    path: "./env"
})

connectDB();



/*
const app = express();

;( async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error
        });

        app.listen(process.env.PORT, ()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    }catch(error){
        console.error("Error: ",error);
        throw error
    }
})()    //IIFEs

*/