const fs = require("fs");
const path = require("path");
const { supportedMimes } = require("../config/filesystem");
const imageToBase64 = require("image-to-base64");

const imageValidator = (size, mime) => {
  if (bytesToMb(size) > 1) {
    return "Image size must be less than 1 MB";
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
  // console.log(path);

  if (fs.existsSync(path)) {
    fs.unlinkSync(path);
  }
};

const convertImageToBase64Old = async (imagePath) => {
  try {
    const base64Image = await imageToBase64(imagePath); // Pass image path directly
    return base64Image; // Return the Base64 string
  } catch (error) {
    throw new Error("Failed to read image file");
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
