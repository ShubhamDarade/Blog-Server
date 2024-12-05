const fs = require("fs");
const { supportedMimes } = require("../config/filesystem");
const imageToBase64 = require("image-to-base64");

const imageValidator = (size, mime) => {
  if (bytesToMb(size) > 5) {
    return "Image size must be less than 5 MB";
  } else if (!supportedMimes.includes(mime)) {
    return "Image must be type of png,jpg,jpeg,svg,wrbp,gif...";
  }
  return null;
};

const bytesToMb = (bytes) => {
  return bytes / (1024 * 1024);
};

const getImgUrl = (imgName) => {
  return `${process.env.APP_URL}/uploads/${imgName}`;
};

const deleteImage = (imageName) => {
  const path = process.cwd() + "/public/" + imageName;
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    } catch (error) {
      console.error("Failed to delete file:", error.message);
    }
  }
};

const convertImageToBase64 = async (imagePath, mimetype) => {
  try {
    const base64Data = await imageToBase64(imagePath); // Convert image to Base64

    // Return Base64 string with MIME type prepended
    return `data:${mimetype};base64,${base64Data}`;
  } catch (error) {
    throw new Error("Failed to read image file");
  }
};

const uploadImage = (avatar, uploadPath) => {
  return new Promise((resolve, reject) => {
    avatar.mv(uploadPath, (err) => {
      if (err) {
        reject("Failed to upload the image.");
      } else {
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
