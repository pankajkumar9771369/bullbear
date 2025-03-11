require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { HoldingsModel } = require("./model/HoldingsModel");
const {PositionsModel}=require("./model/PositionsModel")
const{OrdersModel}=require("./model/OrdersModel")
const dbUrl = process.env.MONGO_URL || 'your-default-mongodb-url-here';

app.use(cors());
app.use(bodyParser.json());

async function main() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to DB');
  } catch (err) {
    console.error('DB connection error:', err);
  }
}

// Call the function to connect to the database
main();


main().catch(err => console.log(err));

// app.get("/addHoldings", async (req, res) => {
//   let tempHoldings = [
//     {
//       name: "BHARTIARTL",
//       qty: 2,
//       avg: 538.05,
//       price: 541.15,
//       net: "+0.58%",
//       day: "+2.99%",
//     },
//     {
//       name: "HDFCBANK",
//       qty: 2,
//       avg: 1383.4,
//       price: 1522.35,
//       net: "+10.04%",
//       day: "+0.11%",
//     },
//     // Add the rest of your holdings here...
//   ];

//   try {
//     // Save all holdings asynchronously and wait for completion
//     await Promise.all(tempHoldings.map(async (item) => {
//       let newHolding = new HoldingsModel({
//         name: item.name,
//         qty: item.qty,
//         avg: item.avg,
//         price: item.price,
//         net: item.net,
//         day: item.day,
//       });
//       await newHolding.save();  // Use await here to handle async save
//     }));

//     res.send("Holdings added successfully!");

//   } catch (err) {
//     console.error('Error saving holdings:', err);
//     res.status(500).send("Error adding holdings");
//   }
// });

// app.get("/addPositions", async (req, res) => {
//   let tempPositions = [
//     {
//       product: "CNC",
//       name: "EVEREADY",
//       qty: 2,
//       avg: 316.27,
//       price: 312.35,
//       net: "+0.58%",
//       day: "-1.24%",
//       isLoss: true,
//     },
//     {
//       product: "CNC",
//       name: "JUBLFOOD",
//       qty: 1,
//       avg: 3124.75,
//       price: 3082.65,
//       net: "+10.04%",
//       day: "-1.35%",
//       isLoss: true,
//     },
//   ];

//   try {
//     // Use Promise.all to handle multiple async save operations concurrently
//     await Promise.all(
//       tempPositions.map(async (item) => {
//         let newPosition = new PositionsModel({
//           product: item.product,
//           name: item.name,
//           qty: item.qty,
//           avg: item.avg,
//           price: item.price,
//           net: item.net,
//           day: item.day,
//           isLoss: item.isLoss,
//         });
//         await newPosition.save();
//       })
//     );
    
//     res.send("Positions added successfully!");
//   } catch (err) {
//     console.error("Error adding positions:", err);
//     res.status(500).send("Error adding positions.");
//   }
// });
app.get("/allHoldings",async(req,res)=>{
  let allHoldings=await HoldingsModel.find({});
  res.json(allHoldings);
});
app.get("/allPositions",async(req,res)=>{
  let allPositions=await PositionsModel.find({});
  res.json(allPositions);
});
app.post("./newOrder",async(req,res)=>{
let newOrder= new  OrdersModel({
  name: req.body.name,
  qty: req.body.qty,
  price: req.body.price,
  mode: req.body.mode,
})
newOrder.save();
res.send("order was saved")
});


app.listen(3002, () => {
  console.log("App is starting on port 3002");
});
