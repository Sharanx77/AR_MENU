require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// --- 1. CONNECT TO MONGODB ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Cloud Database'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- 2. DEFINE DATABASE SCHEMAS ---
const menuSchema = new mongoose.Schema({
  id: Number,
  name: String,
  price: Number,
  diet: String,
  tag: String,
  delivery: String,
  ingredients: String,
  img: String,
  modelUrl: String
});
const MenuItem = mongoose.model('MenuItem', menuSchema);

const orderSchema = new mongoose.Schema({
  orderId: String,
  items: Array,
  total: Number,
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- AI SETUP ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// --- 3. API ROUTES ---

// Fetch Menu from Database
app.get('/api/menu', async (req, res) => {
  try {
    const menu = await MenuItem.find();
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch menu from database" });
  }
});

// Save Order to Database
app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = new Order({
      orderId: `ORD-${Date.now()}`,
      items: req.body.cart,
      total: req.body.total
    });
    
    await newOrder.save(); // Saves to MongoDB
    console.log("🛒 New Order Saved to DB:", newOrder.orderId);
    res.json({ success: true, message: "Order stored permanently!" });
  } catch (error) {
    res.status(500).json({ error: "Failed to save order" });
  }
});

// AI X-Ray Scan
app.post('/api/analyze/:id', async (req, res) => {
  try {
    // Pull the specific item directly from MongoDB
    const item = await MenuItem.findOne({ id: parseInt(req.params.id) });
    if (!item) return res.status(404).json({ error: "Item not found" });

    const prompt = `Analyze this dish: ${item.name}. Ingredients: ${item.ingredients}. Provide realistic estimated calories, protein, and a 2-line fun fact. Return ONLY JSON: {"cal": 450, "pro": "12g", "fact": "..."}`;
    const result = await model.generateContent(prompt);
    const rawText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    
    res.json(JSON.parse(rawText));
  } catch (error) {
    console.error("X-Ray AI Error:", error);
    res.status(500).json({ cal: "N/A", pro: "N/A", fact: "AI offline. Crafted with premium ingredients." });
  }
});

// AI Voice Customization
app.post('/api/customize', async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || transcript === 'Tap to customize...') return res.json({ notes: '' });

  const prompt = `Extract food modifications from this voice transcript: "${transcript}". Ignore filler words. Return ONLY a short kitchen ticket format (max 4 words). If no clear modifications, return exactly: NONE.`;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.toUpperCase().includes('NONE')) text = '';
    res.json({ notes: text });
  } catch (error) {
    res.json({ notes: transcript.replace(/please|i want|give me/gi, "").trim() });
  }
});

// --- 4. DATABASE SEEDER ROUTE (Run this once to populate your DB) ---
app.post('/api/seed', async (req, res) => {
  const INITIAL_DATA = [
    {
  "id": 1,
  "name": "Belgian Waffle",
  "price": 350,
  "diet": "Vegetarian",
  "tag": "Artisan",
  "delivery": "12m",
  "ingredients": "All-purpose flour, baking powder, sugar, salt, milk, eggs (separated for whipping), butter",
  "img": "https://plus.unsplash.com/premium_photo-1664478254358-fb8ce668dca6?q=80&w=991&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "modelUrl": "/models/belgian_waffle.glb",
},
    { id: 2, name: "The Wagyu Burger", price: 750, diet: "Meat", tag: "Bestseller", delivery: "20m", ingredients: "8oz Wagyu beef patty, brioche bun, aged cheddar, caramelized onions, truffle aioli.", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf" },
    { id: 3, name: "Burrata Pizza", price: 600, diet: "Vegetarian", tag: "Handmade", delivery: "22m", ingredients: "Wood-fired crust, San Marzano tomato sauce, fresh burrata cheese, basil leaves, olive oil.", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80", modelUrl: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF/Avocado.gltf" }
  ];
  
  await MenuItem.deleteMany({}); // Clear old data
  await MenuItem.insertMany(INITIAL_DATA); // Insert fresh menu
  res.json({ message: "✅ Database seeded successfully with menu items!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 LUMIÈRE Backend running on http://localhost:${PORT}`));