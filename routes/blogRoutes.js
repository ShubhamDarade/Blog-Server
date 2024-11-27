const express = require("express");
const {
  createBlog,
  getAllBlogs,
  getBlog,
  getLikedBlogs,
  getYourBlogs,
} = require("../controllers/blogController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.post("/create-blog", authMiddleware, createBlog);
router.get("/all-blogs", getAllBlogs);
router.get("/getBlog/:blogId", authMiddleware, getBlog);
router.get("/your-blogs", authMiddleware, getYourBlogs);
router.get("/getLikedBlog", authMiddleware, getLikedBlogs);

module.exports = router;
