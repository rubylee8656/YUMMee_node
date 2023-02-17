const { HmacSHA256 } = require("crypto-js");
const express = require("express");
const router = express.Router();
const db = require(__dirname + "/../modules/db_connect");
const {v4:uuidv4} = require("uuid");
require('dotenv').config();
const Base64 = require('crypto-js/enc-base64');
const { default: axios } = require("axios");

//設定linePay使用變數
const {
    LINEPAY_CHANNEL_ID,
    LINEPAY_VERSION,
    LINEPAY_SITE,
    LINEPAY_CHANNEL_SECRET_KEY,
    LINEPAY_RETURN_HOST,
    LINEPAY_RETURN_CONFIRM_URL,
    LINEPAY_RETURN_CANCEL_URL,
  } = process.env;

  
//建立簽章
    function createSignature(uri,linePayBody){
    const nonce = parseInt(new Date().getTime() / 1000);
    const string = `${LINEPAY_CHANNEL_SECRET_KEY}/${LINEPAY_VERSION}${uri}${JSON.stringify(
        linePayBody
      )}${nonce}`;
    const  signature = Base64.stringify(HmacSHA256(string,LINEPAY_CHANNEL_SECRET_KEY));
    const headers = {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': LINEPAY_CHANNEL_ID,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
    };
    return headers;
  }

//建立訂單
async function createOrder(req,res){
    const output = {
        success:false,
        error:"",
        postData:req.body,
        auth:{},
    };

//設定linepay訂單資料格式
    let orders = {
        amount:0,
        currency: 'TWD',
        orderId: '',
        packages:[
            {
                id:'1',
                amount:0,
                products:[],
            },
        ],
      };

    const products = req.body.orders;
    const {mb_sid,payWay} = req.body;
    const orderNum = uuidv4();
    let totalPrice = 0;
    
    //處理從資料庫取商品價錢 計算總金額
    for (let i=0; i < products.length; i++){
        const price_sql = `SELECT product_price,product_name FROM food_product WHERE sid = ${products[i].sid}`;
        const [price_rows] = await db.query(price_sql);
        products[i].name = price_rows[0].product_name;
        products[i].price =  +price_rows[0].product_price;
        
        //寫入訂單明細(子訂單)進資料庫 
        const detail_sql = "INSERT INTO detail_orders (order_num,product_sid,amount,subtotal) VALUES (?,?,?,?)";
        const [detail_rows] = await db.query(detail_sql,[
            orderNum,
            products[i].sid,
            products[i].amount,
            products[i].price * products[i].amount,
        ]);
        totalPrice += products[i].price * products[i].amount;

        //建立linepay訂單資料
        orders.packages[0].products.push({
            name: products[i].name,
            price: products[i].price,
            quantity: products[i].amount,
        });
    }

        // 寫入訂單(母訂單)進資料庫
        const order_sql = "INSERT INTO orders (order_num,mb_sid,total_price,pay_way,payway_status,ordered_at) VALUES (?,?,?,?,?,NOW())";
        const [order_row] = await db.query(order_sql,[
            orderNum,mb_sid,totalPrice,payWay,'未付款',
        ]);

        //現金
        if (payWay === '現金'){
            output.success = true;
        
        //LinePay
        }else{

            //準備linepaybody
            orders.packages[0].amount =totalPrice;
            orders.amount = totalPrice;
            orders.currency = 'TWD';
            orders.orderId = orderNum;
            const linePayBody = {
            ...orders,
            redirectUrls:{
                confirmUrl:`${LINEPAY_RETURN_HOST}/${LINEPAY_RETURN_CONFIRM_URL}`,
                cancelUrl: `${LINEPAY_RETURN_HOST}/${LINEPAY_RETURN_CANCEL_URL}`,
            },
        };
        const uri = '/payments/request';
        const headers = createSignature(uri, linePayBody);

        const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
        try {
            //第一次導向linepay(訂單資訊)+付款完成要導向等待頁面的網址
            const {data} = await axios.post(url,linePayBody,{headers});
            if(data.returnCode === '0000'){
                output.success = true;
                //linepay付款qrcode網址
                output.pay_url = data.info.paymentUrl.web;
                output.orderNum = orderNum;
             }else{
                output.error = 'LinePay訂單失敗'
             }
        } catch (error) {
            console.log(error);
        }
        }
        
        return{output};  
};
//第二次linePay訂單驗證
async function linePayConfirm(req,res){
    const output = {
        success:false,
        error:'',
    }
    //跟資料庫驗證這筆訂單
    const { transactionId,orderId } = req.query;
    const sql = `SELECT * FROM orders WHERE order_num = '${orderId}'`;
    const [result] = await db.query(sql);
    const linePayBody ={
        amount:result[0].total_price,
        currency:'TWD',
    };

    const uri = `/payments/${transactionId}/confirm`;
    const headers = createSignature(uri, linePayBody);
    const url = `${LINEPAY_SITE}/${LINEPAY_VERSION}${uri}`;
    //將金鑰,總金額,訂單編號打包跟linePay驗證這筆訂單
    const {data} = await axios.post(url, linePayBody, { headers });
    
    if(data.returnCode === '0000'){
        const sql = `UPDATE orders SET payway_status = '已付款' WHERE order_num = '${orderId}'`;
        const result = await db.query(sql);
        output.success = true;
    }else{
        output.error = 'LinePay訂單失敗';
    }

    return {output};
}
//成立一筆購物車訂單
router.post('/neworder',async(req,res)=>{
    res.json(await createOrder(req,res));
})
//取出該會員的訂單
router.get('/getorderlist/:mb_sid',async(req,res)=>{
    const { mb_sid } = req.params;
    const getod_sql = `SELECT * FROM orders WHERE mb_sid = ${mb_sid} ORDER BY sid DESC`;
    const [getorder_rows] = await db.query(getod_sql);
    
    res.json({getorder_rows});
})
//使用linePay付款的購物車訂單
router.post('/linepay',async(req,res)=>{
    const {output} = await createOrder(req,res);
    res.json(output);
})
//linePay訂單二次確認
router.get('/linepay/confirm',async(req,res)=>{

    res.json(await linePayConfirm(req,res));
})

module.exports = router;