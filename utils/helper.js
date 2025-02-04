const fs = require("fs");
const { supportedMimes } = require("../config/filesystem");
const imageToBase64 = require("image-to-base64");
const logger = require("../config/logger");

const imageValidator = (size, mime) => {
  logger.info(
    `[IMAGE VALIDATOR] Validating image - Size: ${size}, Mime: ${mime}`
  );

  if (bytesToMb(size) > 5) {
    logger.warn(`[IMAGE VALIDATOR] Image size exceeds limit - Size: ${size}`);
    return "Image size must be less than 5 MB";
  } else if (!supportedMimes.includes(mime)) {
    logger.warn(`[IMAGE VALIDATOR] Unsupported image type - Mime: ${mime}`);
    return "Image must be type of png,jpg,jpeg,svg,webp,gif...";
  }

  logger.info(`[IMAGE VALIDATOR] Image validation passed`);
  return null;
};

const bytesToMb = (bytes) => {
  return bytes / (1024 * 1024);
};

const getImgUrl = (imgName) => {
  return `${process.env.APP_URL}/uploads/${imgName}`;
};

const deleteImage = (imageName) => {
  const filePath = process.cwd() + "/public/" + imageName;

  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      logger.info(`[DELETE IMAGE] Image deleted - Image Name: ${imageName}`);
    } catch (error) {
      logger.error(
        `[DELETE IMAGE] Failed to delete image - Error: ${error.message}`
      );
    }
  } else {
    logger.warn(`[DELETE IMAGE] Image not found - Image Name: ${imageName}`);
  }
};

const convertImageToBase64 = async (imagePath, mimetype) => {
  try {
    logger.info(
      `[CONVERT IMAGE] Converting image to Base64 - Path: ${imagePath}`
    );
    const base64Data = await imageToBase64(imagePath);
    const base64String = `data:${mimetype};base64,${base64Data}`;
    logger.info(`[CONVERT IMAGE] Image converted successfully`);
    return base64String;
  } catch (error) {
    logger.error(
      `[CONVERT IMAGE] Failed to convert image - Error: ${error.message}`
    );
    throw new Error("Failed to read image file");
  }
};

const uploadImage = (avatar, uploadPath) => {
  logger.info(`[UPLOAD IMAGE] Uploading image - Path: ${uploadPath}`);

  return new Promise((resolve, reject) => {
    avatar.mv(uploadPath, (err) => {
      if (err) {
        logger.error(
          `[UPLOAD IMAGE] Failed to upload image - Error: ${err.message}`
        );
        reject("Failed to upload the image.");
      } else {
        logger.info(
          `[UPLOAD IMAGE] Image uploaded successfully - Path: ${uploadPath}`
        );
        resolve();
      }
    });
  });
};

module.exports = {
  imageValidator,
  bytesToMb,
  getImgUrl,
  deleteImage,
  convertImageToBase64,
  uploadImage,
};
