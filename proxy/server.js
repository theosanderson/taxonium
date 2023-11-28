const express = require("express");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");

const app = express();
const port = 3000;

// CORS middleware settings
const corsOptions = {
  origin: (origin, callback) => {
    if (origin === "https://taxonium.org") {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET"],
};

// Apply CORS

app.use(cors(corsOptions));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Apply the rate limiter to all requests
app.use(limiter);

// Proxy endpoint
app.get("/proxy", async (req, res) => {
  try {
    const response = await axios.get(req.query.url);
    res.send(response.data);
  } catch (error) {
    res.status(500).send({ message: "Error forwarding request" });
    console.log(error);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
