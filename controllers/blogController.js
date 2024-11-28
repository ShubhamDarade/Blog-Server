const mongoose = require("mongoose");
const Blog = require("../models/Blog");
const Like = require("../models/Like");
const User = require("../models/user");
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
  try {
    const { error } = createBlogSchema.validate(req.body, {
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
    const { title, description } = req.body;
    const { id } = req.user;

    let imagePath = "https://formfees.com/wp-content/uploads/dummy.webp";
    const img = req.files?.img;

    if (img) {
      const message = imageValidator(img.size, img.mimetype);
      if (message != null) {
        return res.status(400).json({
          success: false,
          message,
        });
      }

      const imgName = uuidv4() + path.extname(img.name);
      const uploadPath = process.cwd() + "/public/" + imgName;

      await uploadImage(img, uploadPath);
      const img64 = await convertImageToBase64(uploadPath, img.mimetype);

      deleteImage(imgName);
      imagePath = img64;
    }

    const newBlog = await Blog.create({
      title,
      description,
      image: imagePath,
      author: id,
    });
    return res
      .status(201)
      .json({ success: true, message: "Blog created", blog: newBlog });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    // const blogs = await Blog.find({});
    const blogs = await Blog.aggregate([
      { $sort: { createdAt: -1 } }, // Sorting first to use the index
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
    return res.status(201).json({
      success: true,
      message: "All blogs",
      blogCount: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching all blogs callback",
      error: error.message,
    });
  }
};

exports.getBlog = async (req, res) => {
  try {
    const { blogId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
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
          // The field in the blog collection (author)
          foreignField: "_id",
          // The field in the users collection (_id)
          as: "authorDetails",
          // The alias where the user data will be stored
          pipeline: [
            {
              $project: {
                name: 1,
                // Include the user's name
                avatar: 1,
                // Include the user's avatar
                _id: 1, // Exclude the user's _id
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
    return res.status(201).json({
      success: true,
      message: "Blog fetch",
      blog: blog[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching blog callback",
      error: error.message,
    });
  }
};

exports.getLikedBlogs = async (req, res) => {
  try {
    const userId = req.user.id;
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

    res.status(200).json({
      success: true,
      message: "Fetch liked blogs",
      blogCount: blogs.length,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching liked blogs callback",
      error: error.message,
    });
  }
};

exports.getYourBlogs = async (req, res) => {
  try {
    const userId = req.user.id;

    const author = await User.aggregate([
      {
        // Step 1: Match the user by userId
        $match: {
          _id: new mongoose.Types.ObjectId(userId), // Replace with the actual userId
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
      message: "Fetch author blogs",
      author: author[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in fetching your blogs callback",
      error: error.message,
    });
  }
};
