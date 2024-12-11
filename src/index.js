import dotenv from "dotenv";
//we add -r dotenv/config --experimental-json-modules in script in package.json to enable import of dotenv
//we can directly use require but we need consistency so we use import 
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
})

connectDB()
.then(()=>{
    // helps in production if our port got changed 
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("MongoDB connect failed");
})



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