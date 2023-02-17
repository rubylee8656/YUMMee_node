const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken"); 
require("dotenv").config();

//會員註冊
router.post('/sign',async(req,res)=>{
    const output ={
        success:false,
        error:'',
    }
    //檢查必填
    if(!req.body.email || !req.body.password ){
        output.error = '必塡欄位不得空白';
        return res.json(output);
    }
    //檢查有無申請過會員
    const checkMail = "SELECT * FROM `member` WHERE `mb_email` = ?";
    const [rowCheckMail] = await db.query(checkMail,req.body.email.toLowerCase())

    if(rowCheckMail.length > 0){
        output.error = '帳號已註冊'
        return res.json(output)
    }
    //密碼
    const passBcrypt = bcrypt.hashSync(req.body.password, 10);

    const sql =
    "INSERT INTO `member`(`mb_email`, `mb_pass`) VALUES (?, ? )";
    //寫入資料庫
    const [result] = await db.query(sql, [
    req.body.email.toLowerCase(),
    passBcrypt,
    ]);

    if(result.affectedRows){
        output.success = true;
    }
    
    res.json(output)
})
//會員登入
router.post('/login',async(req,res)=>{
    const output={
        success:false,
        mb_sid:'',
        token:'',
    }
    const {email,password} = req.body;
    //進資料庫找這筆帳號
    const sql = 'SELECT * FROM `member` WHERE `mb_email` =?'
    const [result] = await db.query(sql,email.toLowerCase())
    //驗證帳號密碼
    if(
        result[0] &&
        password &&
        bcrypt.compareSync(password,result[0].mb_pass)
        ){
            //建立token
            const token = jwt.sign({mb_sid:result[0].mb_sid},process.env.JWT_SECRET)

            output.mb_sid = result[0].mb_sid;
            output.success = true;
            output.token = token;
        }

        res.json(output);
})

module.exports=router;