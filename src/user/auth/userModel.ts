import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    first_name: {
        type: String,
        require: true,
    },
    last_name: {
        type: String,
        require: true,
    },
    email: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
    },
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
}, { timestamps: true });

module.exports = mongoose.model("user", userSchema);