const express=require("express");
const deleteRoute=express.Router();
//groupModel database
const groupModel=require("../models/chatroom");
//LabReport Schmea
const reportModel=require("../models/labReports");
//patient Schema
const patientModel =require("../models/patients");
//userModel
const userModel=require("../models/userModel");

//this one is for debug purpose
//uncomment to use delete data

deleteRoute.post("/data",async(req,res)=>{
    try{
        await userModel.create({
            name:req.body.name,
            password:req.body.password,
            qualification:req.body.qualification,
            email:req.body.email,
            speciality:req.body.speciality,
            role:2,
            contact_number:req.body.contact
        });
        res.status(200).json({"msg":"Success in storing data"})
    }catch(e){
        res.status(400).json({"msg":"Error in storing data"});
    }
});


deleteRoute.delete("/all",async(req,res)=>{
    try {
        await userModel.deleteMany();
        await patientModel.deleteMany();
        await reportModel.deleteMany();
        await groupModel.deleteMany();       
        res.status(200).json({"msg":"All database deleted"})
        
    } catch (e) {
        console.log("error in deleting database"+e)
        res.status(400).json({"msg":"Error in deleting database"})
    }
    
})




module.exports={deleteRoute};