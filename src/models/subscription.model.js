import mongoose, { model, Schema } from "mongoose";


//this schema is for every user subscribing a channel
//everytime a new document is created when a user subscribe
//Subscribers of channel can calculate by counting number of particular channel documents in db
//for subscribed we count the number of particular subscriber in db
//this method is used instead of the creating a array of subscriber as 
//it require more computation and time  if a person unscribe we have to rearrange the array
const subscriptionSchema = new Schema(
    {
        subscriber: {
            type: Schema.Types.ObjectId, //one who is subscribing
            ref: "User"
        },
        channel: {
            type: Schema.Types.ObjectId, //one to whom 'subscriber' subscribing
            ref: "User",
        }
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model("Subscription", subscriptionSchema);