require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

// top-level middleware
//白名單
const corsOptions = {
    credentials: true,
    origin: function (origin, callback) {
      // console.log({ origin: origin });
      callback(null, true);
    },
  };  
app.use(cors(corsOptions));

const myParser = require('body-parser')

app.use(myParser.json())
app.use(myParser.urlencoded({extended:false}))

//homepage
app.use('/home',require(__dirname + "/routes/home"));

//product
app.use('/product',require(__dirname + "/routes/product"));

//cart
app.use('/cart',require(__dirname + "/routes/cart"));

//member
app.use('/member',require(__dirname + "/routes/member"))


// 靜態資料夾
app.use(express.static("public"));

//404 page
app.use((req,res)=>{
  res.status(404).send('Error!! Page Not Found');
});

// 環境設定
const port = process.env.SERVER_PORT || 3003;

app.listen(port,()=>{
    console.log("server started, server port:",port);
})

module.exports = app;