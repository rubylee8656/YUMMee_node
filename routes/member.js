const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken"); 
require("dotenv").config();

router.post('/sign',async(req,res)=>{
    const output ={
        success:false,
        error:'',
    }

    if(!req.body.email || !req.body.password ){
        output.error = '必塡欄位不得空白';
        return res.json(output);
    }

    const checkMail = "SELECT * FROM `member` WHERE `mb_email` = ?";
    const [rowCheckMail] = await db.query(checkMail,req.body.email.toLowerCase())

    if(rowCheckMail.length > 0){
        output.error = '帳號已註冊'
        return res.json(output)
    }

    const passBcrypt = bcrypt.hashSync(req.body.password, 10);

    const sql =
    "INSERT INTO `member`(`mb_email`, `mb_pass`) VALUES (?, ? )";

    const [result] = await db.query(sql, [
    req.body.email.toLowerCase(),
    passBcrypt,
    ]);

    if(result.affectedRows){
        output.success = true;
    }
    
    res.json(output)
})

router.post('/login',async(req,res)=>{
    const sql = 'SELECT * FROM `member` WHERE `mb_email` =?'
    const output={
        success:false,
        mb_sid:'',
        token:'',
    }

    const {email,password} = req.body;
    const [result] = await db.query(sql,email.toLowerCase())
    console.log(result);
    if(
        result[0] &&
        password &&
        bcrypt.compareSync(password,result[0].mb_pass)
        ){
            const token = jwt.sign({mb_sid:result[0].mb_sid},process.env.JWT_SECRET)

            output.mb_sid = result[0].mb_sid;
            output.success = true;
            output.token = token;
        }

        res.json(output);
})

module.exports=router;