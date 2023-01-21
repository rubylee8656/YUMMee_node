const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const {v4:uuidv4} = require("uuid");

async function createOrder(req,res){
    const output = {
        success:false,
        error:"",
        postData:req.body,
        auth:{},
    };
    
}