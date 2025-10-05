// routes/index.js
var express = require('express');
var router = express.Router();

// Home page
router.get('/', function(req, res, next) {
  res.render('index');
});

// Shop page
router.get('/shop', function(req, res, next) {
const products = [
  { id: 1, name: "Phone Case (Type A)", description: "Durable protective case for smartphones", price: 19.99, image: "/images/Item_01.jpg" },
  { id: 2, name: "Phone Case (Type B)", description: "Slim and stylish phone protection", price: 24.99, image: "/images/item_02.jpg" },
  { id: 3, name: "Power Bank", description: "Portable charger for on-the-go power", price: 39.99, image: "/images/Item_03.jpg" },
  { id: 4, name: "Phone Case (Type C)", description: "Rugged case for maximum phone protection", price: 29.99, image: "/images/item_04.jpg" },
  { id: 5, name: "Wireless Charger", description: "Fast and convenient wireless charging pad", price: 34.99, image: "/images/item_05.jpg" },
  { id: 6, name: "Power Bank with Cable", description: "High-capacity portable charger with built-in cable", price: 49.99, image: "/images/item_06.jpg" },
  { id: 7, name: "Smart Phone", description: "Latest model smartphone with advanced features", price: 699.99, image: "/images/item_07.jpg" },
  { id: 8, name: "iPhone 16", description: "Next-generation iPhone with cutting-edge technology", price: 999.99, image: "/images/item_08.jpg" },
];

  res.render('shop', { title: "ID-Repair Shop", products });
});

module.exports = router;
