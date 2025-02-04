const mongoose = require("mongoose");
const user = require("../models/user");
const logger = require("../config/logger");

exports.getAllAuthors = async (req, res) => {
  logger.info(`[GET ALL AUTHORS] Request received`);

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

          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$author", "$$userId"],
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
        $match: {
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
          },
        },
      },
    ]);

    logger.info(`[GET ALL AUTHORS] Success - Total Authors: ${authors.length}`);
    return res.status(200).json({
      success: true,
      message: "All authors fetched successfully",
      authorCount: authors.length,
      authors,
    });
  } catch (error) {
    logger.error(`[GET ALL AUTHORS] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching all authors",
      error: error.message,
    });
  }
};

exports.getAuthor = async (req, res) => {
  const { authorId } = req.params;
  logger.info(`[GET AUTHOR] Request received - Author ID: ${authorId}`);

  try {
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      logger.warn(`[GET AUTHOR] Invalid Author ID: ${authorId}`);
      return res.status(400).json({
        success: false,
        message: "Invalid author ID",
      });
    }

    const authorExists = await user.findById(authorId);
    if (!authorExists) {
      logger.warn(
        `[GET AUTHOR] Author does not exist - Author ID: ${authorId}`
      );
      return res.status(400).json({
        success: false,
        message: "Author does not exist",
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

    logger.info(
      `[GET AUTHOR] Author fetched successfully - Author ID: ${authorId}, Blog Count: ${author[0]?.blogCount}`
    );
    return res.status(200).json({
      success: true,
      message: "Author fetched successfully",
      author: author[0],
    });
  } catch (error) {
    logger.error(`[GET AUTHOR] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Error in fetching author details",
      error: error.message,
    });
  }
};
