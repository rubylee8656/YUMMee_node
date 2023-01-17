require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");

// top-level middleware
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

//member
app.use('/member',require(__dirname + "/routes/member"))


// 環境設定
app.use(express.static("public"));

const port = process.env.SERVER_PORT || 3003;

app.listen(port,()=>{
    console.log("server started, server port:",port);
})

module.exports = app;