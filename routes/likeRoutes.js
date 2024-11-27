const express = require("express");
const {
  addLike,
  removeLike,
  getLike,
} = require("../controllers/likeContoller");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.get("/get-likes/:blogId", authMiddleware, getLike);
router.post("/add-like/:blogId", authMiddleware, addLike);
router.delete("/remove-like/:blogId", authMiddleware, removeLike);

module.exports = router;
