const mongoose = require("mongoose");
const user = require("../models/user");

exports.getAllAuthors = async (req, res) => {
  try {
    const authors = await user.aggregate([
      {
        $project: {
          _id: 1,
          name: 1,
          avatar: 1,
        },
      },
      {
        $lookup: {
          from: "blogs",
          let: {
            userId: "$_id",
          },
          // Pass the user _id to the lookup stage
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$author", "$$userId"], // Match blogs where author is the user _id
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: "blogs",
        },
      },
      {
        $match:
          /**
           * query: The query in MQL.
           */
          {
            blogs: {
              $ne: [],
            },
          },
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          email: 1,
          blogCount: {
            $size: "$blogs",
          }, // Count the number of blogs
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      message: "All authors",
      authorCount: authors.length,
      authors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching all authors callback",
      error: error.message,
    });
  }
};

exports.getAuthor = async (req, res) => {
  try {
    const { authorId } = req.params;

    // Check if id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const author = await user.aggregate([
      {
        // Step 1: Match the user by userId
        $match: {
          _id: new mongoose.Types.ObjectId(authorId), // Replace with the actual userId
        },
      },
      {
        // Step 2: Lookup blogs written by this user, with projection and sorting
        $lookup: {
          from: "blogs",
          localField: "_id", // Local field is user's _id
          foreignField: "author", // Foreign field is the author field in blogs
          as: "blogs", // This will store all blogs written by the user
          pipeline: [
            {
              $project: {
                title: 1, // Only include title
                image: 1, // Only include image
              },
            },
            {
              $sort: { createdAt: -1 }, // Sort blogs by createdAt in descending order
            },
          ],
        },
      },
      {
        // Step 3: Project the user fields and the count of blogs
        $project: {
          name: 1,
          avatar: 1,
          blogCount: { $size: "$blogs" }, // Count the total number of blogs
          blogs: 1, // Only include the sorted and projected blogs
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Author fetch",
      author: author[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching all authors callback",
      error: error.message,
    });
  }
};
