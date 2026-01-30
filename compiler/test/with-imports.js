// Compiled from C-slop
const { app, db, request, response, utils } = runtime;

const axios = require('axios');
const {format} = require('date-fns');

// Route: GET /
app.get('/', async (req, res) => {
  try {
    const $ = request(req);
    res.json({message: "C-slop with imports!", date: format(Date.now(), "yyyy-MM-dd HH:mm:ss")});
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route: GET /github
app.get('/github', async (req, res) => {
  try {
    const $ = request(req);
    const result0 = await axios.get("https://api.github.com");
    res.json(result0);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route: GET /users
app.get('/users', async (req, res) => {
  try {
    const $ = request(req);
    const data0 = await db.users.findAll();
    res.json(data0);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Route: POST /users
app.post('/users', async (req, res) => {
  try {
    const $ = request(req);
    const data0 = await db.users.insert(req.body);
    res.json(data0);
  } catch (error) {
    console.error("Route error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});