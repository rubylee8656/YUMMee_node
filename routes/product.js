const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");

//取得商品資料
router.get('/list',async(req,res)=>{
    const product_sql ="SELECT `food_product`.* , `product_picture`.`picture_url` FROM `food_product` JOIN `product_picture` ON `food_product`.`sid` = `product_picture`.`food_product_sid` GROUP by `food_product`.`sid`;"

    const [product_rows] = await db.query(product_sql);

    res.json({product_rows});
})
//取得商品明細
router.get('/:sid',async(req,res)=>{
    const {sid} = req.params;
    const product_sql =`SELECT food_product.* , product_picture.picture_url FROM food_product JOIN product_picture ON food_product.sid = product_picture.food_product_sid WHERE food_product.sid = ${sid} GROUP by food_product.sid;`

    const [product_rows] = await db.query(product_sql);

    res.json({product_rows});
})

module.exports=router;