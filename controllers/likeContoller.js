const mongoose = require("mongoose");
const Like = require("../models/Like");
const Blog = require("../models/Blog");
const User = require("../models/user");
const logger = require("../config/logger");

exports.addLike = async (req, res) => {
  const userId = req.user.id;
  const { blogId } = req.params;
  logger.info(
    `[ADD LIKE] Request received - User ID: ${userId}, Blog ID: ${blogId}`
  );

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[ADD LIKE] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }
    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[ADD LIKE] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[ADD LIKE] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[ADD LIKE] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const existingLike = await Like.findOne({ blogId, userId });
    if (existingLike) {
      logger.warn(
        `[ADD LIKE] Already liked - User ID: ${userId}, Blog ID: ${blogId}`
      );
      return res.status(400).json({ success: false, message: "Already liked" });
    }

    const like = await Like.create({ blogId, userId });
    logger.info(
      `[ADD LIKE] Like added successfully - User ID: ${userId}, Blog ID: ${blogId}`
    );

    return res.status(201).json({ success: true, message: "Like added", like });
  } catch (error) {
    logger.error(`[ADD LIKE] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in add like callback",
      error: error.message,
    });
  }
};

exports.removeLike = async (req, res) => {
  const userId = req.user.id;
  const { blogId } = req.params;
  logger.info(
    `[REMOVE LIKE] Request received - User ID: ${userId}, Blog ID: ${blogId}`
  );

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[REMOVE LIKE] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }
    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[REMOVE LIKE] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[REMOVE LIKE] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[REMOVE LIKE] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const like = await Like.findOneAndDelete({ blogId, userId });
    if (!like) {
      logger.warn(
        `[REMOVE LIKE] Like not found - User ID: ${userId}, Blog ID: ${blogId}`
      );
      return res
        .status(400)
        .json({ success: false, message: "Like not found" });
    }

    logger.info(
      `[REMOVE LIKE] Like removed successfully - User ID: ${userId}, Blog ID: ${blogId}`
    );
    return res
      .status(200)
      .json({ success: true, message: "Like removed successfully" });
  } catch (error) {
    logger.error(`[REMOVE LIKE] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in remove like callback",
      error: error.message,
    });
  }
};

exports.getLike = async (req, res) => {
  const userId = req.user.id;
  const { blogId } = req.params;
  logger.info(
    `[GET LIKE] Request received - User ID: ${userId}, Blog ID: ${blogId}`
  );

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[GET LIKE] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }
    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[GET LIKE] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[GET LIKE] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }
    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[GET LIKE] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const result = await Blog.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(blogId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "authorDetails",
          pipeline: [
            {
              $project: {
                name: 1,
                avatar: 1,
                _id: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: "$authorDetails",
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "blogId",
          as: "likes",
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$likes" },
          userLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.userId"],
          },
        },
      },
      {
        $project: {
          "authorDetails.name": 1,
          "authorDetails.avatar": 1,
          "authorDetails._id": 1,
          likeCount: 1,
          userLiked: 1,
        },
      },
    ]);

    logger.info(
      `[GET LIKE] Fetch successful - Blog ID: ${blogId}, Likes: ${
        result[0]?.likeCount || 0
      }`
    );
    res.status(200).json({
      success: true,
      message: "Fetch like",
      result: result[0],
    });
  } catch (error) {
    logger.error(`[GET LIKE] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in get like callback",
      error: error.message,
    });
  }
};
