const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const cors = require("cors");

router.get("/shop_home", async (req, res, next) => {

    const shop_sql =
      "SELECT s.*, c.`shop_city`, a.`shop_area` ,fc.`category_name` FROM `shop_list` s JOIN `shop_address_city` c ON s.`shop_address_city_sid` = c.`sid` JOIN `shop_address_area` a ON s.`shop_address_area_sid` = a.`sid` JOIN `food_product` f ON s.`sid` = f.`shop_list_sid` JOIN `product_category` fc ON f.`product_category_sid` = fc.`sid`";
    const [shop_rows] = await db.query(shop_sql);
    const shop_dic = {};
    shop_rows.forEach((rows) => {
      const cate = rows.category_name;
      if (shop_dic[rows.sid]) {
        if (!shop_dic[rows.sid].cates.includes(cate)) {
          shop_dic[rows.sid].cates.push(cate);
        }
      } else {
        shop_dic[rows.sid] = { rows, cates: [cate] };
      }
    });
  
    res.json(Object.values(shop_dic));

  });
  module.exports=router;