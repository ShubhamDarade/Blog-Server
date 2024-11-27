const mongoose = require("mongoose");
const Like = require("../models/Like");
const Blog = require("../models/Blog");

exports.addLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blogId } = req.params;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const existingLike = await Like.findOne({ blogId, userId });

    if (existingLike) {
      return res.status(400).json({ success: false, message: "Already liked" });
    }

    const like = await Like.create({ blogId, userId });

    return res.status(201).json({ success: true, message: "Like added", like });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in add like callback",
      error: error.message,
    });
  }
};

exports.removeLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blogId } = req.params;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const like = await Like.findOneAndDelete({ blogId, userId });

    if (!like) {
      return res
        .status(400)
        .json({ success: false, message: "Like not found" }); // No like found to remove
    }

    return res
      .status(200)
      .json({ success: true, message: "Like removed successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in add like callback",
      error: error.message,
    });
  }
};

exports.getLike2 = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blogId } = req.params;

    const likeCount = await Like.countDocuments({ blogId });

    // Check if the user has liked the blog
    let userLiked = await Like.exists({ blogId, userId });
    userLiked = userLiked ? true : false;

    res.status(200).json({
      success: true,
      message: "Fetch like",
      likeCount, // Total number of likes
      userLiked, // Whether the user has liked the blog (true or false)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in get like callback",
      error: error.message,
    });
  }
};

exports.getLike = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blogId } = req.params;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const result = await Blog.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(blogId),
        },
      },
      {
        $lookup: {
          from: "users", // Join with users collection
          localField: "author", // Match the author field in the Blog collection
          foreignField: "_id", // Match with _id in the Users collection
          as: "authorDetails", // The alias for the joined author data
          pipeline: [
            {
              $project: {
                name: 1, // Include the author's name
                avatar: 1, // Include the author's avatar
                _id: 1, // Include the author's id
              },
            },
          ],
        },
      },
      {
        $unwind: "$authorDetails", // Flatten the authorDetails array
      },
      {
        $lookup: {
          from: "likes", // Join with the Likes collection
          localField: "_id", // Match the blog's _id with the Like's blogId
          foreignField: "blogId", // Foreign key in Likes collection (blogId)
          as: "likes", // Alias for the likes array
        },
      },
      {
        $addFields: {
          likeCount: { $size: "$likes" }, // Calculate like count
          userLiked: {
            $in: [new mongoose.Types.ObjectId(userId), "$likes.userId"], // Check if the user has liked the blog
          },
        },
      },
      {
        $project: {
          "authorDetails.name": 1, // Include the author's name
          "authorDetails.avatar": 1, // Include the author's avatar
          "authorDetails._id": 1, // Include the author's _id
          likeCount: 1, // Include like count
          userLiked: 1, // Whether the user has liked the blog
        },
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Fetch like",
      result: result[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in get like callback",
      error: error.message,
    });
  }
};
