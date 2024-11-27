const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userValidation = require("../validations/userValidation");
const {
  imageValidator,
  convertImageToBase64,
  uploadImage,
  deleteImage,
} = require("../utils/helper");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

exports.registerUser = async (req, res) => {
  const { error } = userValidation.registerSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((err) => err.message).join(", ");
    return res.status(400).json({
      success: false,
      message: "Validaations fails",
      error: errorMessages,
    });
  }

  let avatarPath =
    "https://media.istockphoto.com/id/1341046662/vector/picture-profile-icon-human-or-people-sign-and-symbol-for-template-design.jpg?s=612x612&w=0&k=20&c=A7z3OK0fElK3tFntKObma-3a7PyO8_2xxW0jtmjzT78=";
  const avatar = req.files?.avatar;

  if (avatar) {
    const message = imageValidator(avatar.size, avatar.mimetype);
    if (message != null) {
      return res.status(400).json({
        success: false,
        message,
      });
    }

    const imgName = uuidv4() + path.extname(avatar.name);
    const uploadPath = process.cwd() + "/public/" + imgName;

    await uploadImage(avatar, uploadPath);
    const img64 = await convertImageToBase64(uploadPath, avatar.mimetype);
    deleteImage(imgName);
    avatarPath = img64;
  }

  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user)
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });

    user = new User({ name, email, password, avatar: avatarPath });
    await user.save();

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    res.status(201).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in register callback",
      error: error.message,
    });
  }
};

exports.loginUser = async (req, res) => {
  const { error } = userValidation.loginSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    const errorMessages = error.details.map((err) => err.message).join(", ");
    return res.status(400).json({
      success: false,
      message: "Validaations fails",
      error: errorMessages,
    });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });

    const payload = {
      id: user._id,
      name: user.name,
      email: user.email,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error in login callback", error });
  }
};
