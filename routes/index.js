const express = require("express");
const authRoute = require("./authRoutes");
const blogRoute = require("./blogRoutes");
const userRoute = require("./userRoutes");
const commentRoute = require("./commentRoutes");
const likeRoute = require("./likeRoutes");

const router = express.Router();

router.use("/api/v1/auth", authRoute);
router.use("/api/v1/blog", blogRoute);
router.use("/api/v1/user", userRoute);
router.use("/api/v1/comment", commentRoute);
router.use("/api/v1/like", likeRoute);

module.exports = router;
