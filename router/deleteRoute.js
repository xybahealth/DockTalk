const express=require("express");
const deleteRoute=express.Router();

deleteRoute.delete("/all",(req,res)=>{
    res.status(200).json({"msg":"All data deleted"});
})




module.exports={deleteRoute};