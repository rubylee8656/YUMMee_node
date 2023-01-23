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
    const {orders,mb_sid,payWay} = req.body;
    const orderNum = uuidv4();
    let totalPrice = 0;

    for (let i=0; i<orders.length; i++){
        const price_sql = `SELECT product_price FROM food_product WHERE sid = ${orders[i].sid}`;
        const [price_rows] = await db.query(price_sql);
        // console.log(price_rows[0].product_price);
        // console.log(orders[i].amount);

        const detail_sql = "INSERT INTO detail_orders (order_num,product_sid,amount,subtotal) VALUES (?,?,?,?)";
        const [detail_rows] = await db.query(detail_sql,[
            orderNum,
            orders[i].sid,
            orders[i].amount,
            +price_rows[0].product_price * +orders[i].amount,
        ]);
        totalPrice += +price_rows[0].product_price * +orders[i].amount;

    }

    const order_sql = "INSERT INTO orders (order_num,mb_sid,total_price,pay_way,ordered_at) VALUES (?,?,?,?,NOW())";
    const [order_rows] = await db.query(order_sql,[
        orderNum,mb_sid,totalPrice,payWay,
    ]);

    if(order_rows.affectedRows){
        // console.log('okokokok');
        output.success = true;
    }
    
    return{output,orderNum};
    
}

router.post('/neworder',async(req,res)=>{
    res.json(await createOrder(req,res));
})

// router.get('/getorder/:mb_sid',async(req,res)=>{
//     const { mb_sid } = req.params;
//     const getod_sql = `SELECT * FROM orders WHERE mb_sid = ${mb_sid}`;
//     const [getorder_rows] = await db.query(getod_sql);
//     res.json({getorder_rows});
// })

module.exports = router;