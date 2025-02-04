const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const {
  registerSchema,
  loginSchema,
} = require("../validations/userValidation");
const {
  imageValidator,
  convertImageToBase64,
  uploadImage,
  deleteImage,
} = require("../utils/helper");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

exports.registerUser = async (req, res) => {
  logger.info(`[REGISTER] Request received - Email: ${req.body.email}`);

  const { error } = registerSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((err) => err.message).join(", ");
    logger.warn(`[REGISTER] Validation failed - Errors: ${errorMessages}`);
    return res.status(400).json({
      success: false,
      message: errorMessages,
      error: errorMessages,
    });
  }

  let avatarPath =
    "https://media.istockphoto.com/id/1341046662/vector/picture-profile-icon-human-or-people-sign-and-symbol-for-template-design.jpg?s=612x612&w=0&k=20&c=A7z3OK0fElK3tFntKObma-3a7PyO8_2xxW0jtmjzT78=";

  const avatar = req.files?.avatar;
  let imgName;

  try {
    if (avatar) {
      const message = imageValidator(avatar.size, avatar.mimetype);
      if (message != null) {
        logger.warn(`[REGISTER] Image validation failed - Error: ${message}`);
        return res.status(400).json({ success: false, message });
      }

      imgName = uuidv4() + path.extname(avatar.name);
      const uploadPath = process.cwd() + "/public/" + imgName;

      await uploadImage(avatar, uploadPath);
      const img64 = await convertImageToBase64(uploadPath, avatar.mimetype);

      avatarPath = img64;
      logger.info(
        `[REGISTER] Image uploaded successfully - Image Name: ${imgName}`
      );
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      logger.warn(
        `[REGISTER] Failed - User already exists with email: ${email}`
      );
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    user = new User({ name, email, password, avatar: avatarPath });
    await user.save();

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    logger.info(`[REGISTER] Success - User ID: ${user._id}`);
    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      userName: user.name,
      userAvatar: user.avatar,
    });
  } catch (error) {
    logger.error(`[REGISTER] Error - ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.message,
    });
  } finally {
    if (imgName) {
      deleteImage(imgName);
      logger.info(`[REGISTER] Image deleted - Image Name: ${imgName}`);
    }
  }
};

exports.loginUser = async (req, res) => {
  logger.info(`[LOGIN] Request received - Email: ${req.body.email}`);

  const { error } = loginSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((err) => err.message).join(", ");
    logger.warn(`[LOGIN] Validation failed - Errors: ${errorMessages}`);
    return res.status(400).json({
      success: false,
      message: errorMessages,
      error: errorMessages,
    });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`[LOGIN] Failed - Invalid email: ${email}`);
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`[LOGIN] Failed - Incorrect password for email: ${email}`);
      return res
        .status(400)
        .json({ success: false, message: "Invalid credentials" });
    }

    const payload = { id: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "365d",
    });

    logger.info(`[LOGIN] Success - User ID: ${user._id}`);
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      userName: user.name,
      userAvatar: user.avatar,
    });
  } catch (error) {
    logger.error(`[LOGIN] Error - ${error.message}`);
    res
      .status(500)
      .json({ success: false, message: "Error in login callback", error });
  }
};
