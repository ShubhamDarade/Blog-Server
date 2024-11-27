const express = require("express");
const {
  createComment,
  getComments,
} = require("../controllers/commentControllers");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.post("/create-comment/:blogId", authMiddleware, createComment);
router.get("/all-comments/:blogId", authMiddleware, getComments);

module.exports = router;
