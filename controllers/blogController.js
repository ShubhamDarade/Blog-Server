const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const Like = require("../models/Like");
const User = require("../models/user");
const logger = require("../config/logger");
const {
  imageValidator,
  convertImageToBase64,
  uploadImage,
  deleteImage,
} = require("../utils/helper");
const { createBlogSchema } = require("../validations/blogValidation");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

exports.createBlog = async (req, res) => {
  let imgName;
  logger.info(`[CREATE BLOG] Request received - User ID: ${req.user.id}`);

  try {
    const { error } = createBlogSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(", ");
      logger.warn(`[CREATE BLOG] Validation failed - Errors: ${errorMessages}`);
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    let imagePath = "https://formfees.com/wp-content/uploads/dummy.webp";
    const img = req.files?.img;

    if (img) {
      const message = imageValidator(img.size, img.mimetype);
      if (message != null) {
        logger.warn(
          `[CREATE BLOG] Image validation failed - Error: ${message}`
        );
        return res.status(400).json({
          success: false,
          message,
        });
      }

      imgName = uuidv4() + path.extname(img.name);
      const uploadPath = process.cwd() + "/public/" + imgName;

      await uploadImage(img, uploadPath);
      const img64 = await convertImageToBase64(uploadPath, img.mimetype);

      imagePath = img64;
      logger.info(
        `[CREATE BLOG] Image uploaded successfully - Image Name: ${imgName}`
      );
    }

    const { title, description } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[CREATE BLOG] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[CREATE BLOG] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const newBlog = await Blog.create({
      title,
      description,
      image: imagePath,
      author: userId,
    });

    logger.info(
      `[CREATE BLOG] Blog created successfully - Blog ID: ${newBlog._id}`
    );
    return res
      .status(201)
      .json({ success: true, message: "Blog created", blog: newBlog });
  } catch (error) {
    logger.error(`[CREATE BLOG] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  } finally {
    if (imgName) {
      deleteImage(imgName);
      logger.info(`[CREATE BLOG] Image deleted - Image Name: ${imgName}`);
    }
  }
};

exports.getAllBlogs = async (req, res) => {
  logger.info(`[GET ALL BLOGS] Request received`);

  try {
    const blogs = await Blog.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $project: {
          description: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { authorId: "$author" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$authorId"] },
              },
            },
            { $project: { name: 1, avatar: 1 } },
          ],
          as: "authorDetails",
        },
      },
      { $unwind: "$authorDetails" },
    ]);

    logger.info(
      `[GET ALL BLOGS] Fetch successful - Total Blogs: ${blogs.length}`
    );
    return res.status(200).json({
      success: true,
      message: "All blogs fetched successfully",
      blogCount: blogs.length,
      blogs,
    });
  } catch (error) {
    logger.error(`[GET ALL BLOGS] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching all blogs callback",
      error: error.message,
    });
  }
};

exports.getBlog = async (req, res) => {
  const { blogId } = req.params;
  logger.info(`[GET BLOG] Request received - Blog ID: ${blogId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      logger.warn(`[GET BLOG] Invalid Blog ID: ${blogId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const isBlogExists = await Blog.findOne({ _id: blogId });
    if (!isBlogExists) {
      logger.warn(`[GET BLOG] Blog does not exist - Blog ID: ${blogId}`);
      return res
        .status(400)
        .json({ success: false, message: "Blog does not exist" });
    }

    const blog = await Blog.aggregate([
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
        $unwind: {
          path: "$authorDetails",
        },
      },
    ]);

    logger.info(`[GET BLOG] Fetch successful - Blog ID: ${blogId}`);
    return res.status(200).json({
      success: true,
      message: "Blog fetched successfully",
      blog: blog[0],
    });
  } catch (error) {
    logger.error(`[GET BLOG] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching blog callback",
      error: error.message,
    });
  }
};

exports.getLikedBlogs = async (req, res) => {
  const userId = req.user.id;
  logger.info(`[GET LIKED BLOGS] Request received - User ID: ${userId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[GET LIKED BLOGS] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[GET LIKED BLOGS] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const blogs = await Like.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $project: {
          blogId: 1,
          _id: 0,
        },
      },
      {
        $lookup: {
          from: "blogs",
          let: { blogId: "$blogId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$blogId"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                title: 1,
                image: 1,
                author: 1,
              },
            },
          ],
          as: "blogDetails",
        },
      },
      {
        $unwind: {
          path: "$blogDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { authorId: "$blogDetails.author" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", "$$authorId"],
                },
              },
            },
            {
              $project: {
                name: 1,
                avatar: 1,
              },
            },
          ],
          as: "blogDetails.authorDetails",
        },
      },
      {
        $unwind: {
          path: "$blogDetails.authorDetails",
        },
      },
    ]);

    logger.info(
      `[GET LIKED BLOGS] Fetch successful - User ID: ${userId}, Total Liked Blogs: ${blogs.length}`
    );
    res.status(200).json({
      success: true,
      message: "Fetch liked blogs",
      blogCount: blogs.length,
      blogs,
    });
  } catch (error) {
    logger.error(`[GET LIKED BLOGS] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching liked blogs callback",
      error: error.message,
    });
  }
};

exports.getYourBlogs = async (req, res) => {
  const userId = req.user.id;
  logger.info(`[GET YOUR BLOGS] Request received - User ID: ${userId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      logger.warn(`[GET YOUR BLOGS] Invalid User ID: ${userId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const isUserExists = await User.findOne({ _id: userId });
    if (!isUserExists) {
      logger.warn(`[GET YOUR BLOGS] User does not exist - User ID: ${userId}`);
      return res
        .status(400)
        .json({ success: false, message: "User does not exist" });
    }

    const author = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "_id",
          foreignField: "author",
          as: "blogs",
          pipeline: [
            {
              $project: {
                title: 1,
                image: 1,
              },
            },
            {
              $sort: { createdAt: -1 },
            },
          ],
        },
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          blogCount: { $size: "$blogs" },
          blogs: 1,
        },
      },
    ]);

    logger.info(
      `[GET YOUR BLOGS] Fetch successful - User ID: ${userId}, Total Blogs: ${author[0]?.blogCount}`
    );
    return res.status(200).json({
      success: true,
      message: "Fetch author blogs",
      author: author[0],
    });
  } catch (error) {
    logger.error(`[GET YOUR BLOGS] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching your blogs callback",
      error: error.message,
    });
  }
};
