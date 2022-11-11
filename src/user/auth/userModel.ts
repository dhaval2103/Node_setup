import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    first_name : {type:String , default:null},
    last_name : {type:String , default:null},
    email : {type:String , unique:true},
    password : {type:String },
    accessToken : {type:String ,default:null},

});
module.exports=mongoose.model("user",userSchema);