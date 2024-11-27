const express = require("express");
const { getAllAuthors, getAuthor } = require("../controllers/userController");
const { authMiddleware } = require("../middlewares/authenticate");

const router = express.Router();

router.get("/all-authors", authMiddleware, getAllAuthors);
router.get("/getAuthor/:authorId", authMiddleware, getAuthor);

module.exports = router;
