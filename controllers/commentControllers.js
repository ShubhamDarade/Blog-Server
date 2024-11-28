const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const { createCommentSchema } = require("../validations/commentValidation");

exports.createComment = async (req, res) => {
  try {
    const { error } = createCommentSchema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errorMessages = error.details.map((err) => err.message).join(", ");
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
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const comment = await Comment.create({ content, blogId, userId });
    return res
      .status(201)
      .json({ success: true, message: "Comment created", comment });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in create comment callback",
      error: error.message,
    });
  }
};

exports.getComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const comments = await Comment.aggregate([
      {
        $match: {
          blogId: new mongoose.Types.ObjectId(blogId), // Match comments with the specified blogId
        },
      },
      {
        // Step 1: Sort the comments by createdAt in ascending order
        $sort: {
          createdAt: -1, // Sort comments by createdAt in ascending order
        },
      },
      {
        // Step 2: Lookup to fetch user details based on userId from the comment
        $lookup: {
          from: "users", // Name of the users collection
          localField: "userId", // Field in comments collection (userId)
          foreignField: "_id", // Field in users collection (_id)
          as: "user", // Alias for storing user data
          pipeline: [
            {
              $project: {
                name: 1, // Include the user's name
                avatar: 1, // Include the user's avatar
                _id: 1, // Exclude the user's _id
              },
            },
          ],
        },
      },
      {
        // Step 3: Unwind user data (because $lookup creates an array)
        $unwind: {
          path: "$user", // Flatten the user data array
          preserveNullAndEmptyArrays: true, // Handle cases where there might not be a user
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
    return res.status(200).json({
      success: true,
      message: "Fetch comments",
      commentCount: comments.length,
      comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching comments callback",
      error: error.message,
    });
  }
};
