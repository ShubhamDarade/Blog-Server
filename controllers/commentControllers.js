const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const User = require("../models/user");
const logger = require("../config/logger");
const { createCommentSchema } = require("../validations/commentValidation");

exports.createComment = async (req, res) => {
  logger.info(
    `[CREATE COMMENT] Request received - User ID: ${req.user.id}, Blog ID: ${req.params.blogId}`
  );

  try {
    const { error } = createCommentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(", ");
      logger.warn(
        `[CREATE COMMENT] Validation failed - Errors: ${errorMessages}`
      );
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    const userId = req.user.id;
    const { blogId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[CREATE COMMENT] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[CREATE COMMENT] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[CREATE COMMENT] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[CREATE COMMENT] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const comment = await Comment.create({ content, blogId, userId });
    logger.info(
      `[CREATE COMMENT] Comment created successfully - Comment ID: ${comment._id}`
    );

    return res
      .status(201)
      .json({ success: true, message: "Comment created", comment });
  } catch (error) {
    logger.error(`[CREATE COMMENT] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in create comment callback",
      error: error.message,
    });
  }
};

exports.getComments = async (req, res) => {
  const { blogId } = req.params;
  logger.info(`[GET COMMENTS] Request received - Blog ID: ${blogId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[GET COMMENTS] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[GET COMMENTS] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          blogId: new mongoose.Types.ObjectId(blogId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
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
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          content: 1,
          user: 1,
        },
      },
    ]);

    logger.info(
      `[GET COMMENTS] Success - Blog ID: ${blogId}, Total Comments: ${comments.length}`
    );
    return res.status(200).json({
      success: true,
      message: "Fetch comments",
      commentCount: comments.length,
      comments,
    });
  } catch (error) {
    logger.error(`[GET COMMENTS] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching comments callback",
      error: error.message,
    });
  }
};
