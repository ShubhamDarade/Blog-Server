require("dotenv").config();
const express = require("express");
const db = require("./database/db");
const cors = require("cors");
const Routes = require("./routes/index");
const fileUpload = require("express-fileupload");
// const helmet = require("helmet");
const limiter = require("./config/ratelimiter");

db.connectDB();

const app = express();

app.use(
  cors({
    origin: process.env.CORS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
// app.use(helmet());
app.use(limiter);
app.use(fileUpload());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(Routes);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server Running on port no ${PORT}`);
});
