const express = require("express");
const postModel = require("../posts/schema");
const cloudinary = require("../../cludinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

const postsRouter = express.Router();

const errorHandler = async (errorText, value, httpStatusCode) => {
  const err = new Error();
  err.errors = [{ value: value, msg: errorText }];
  err.httpStatusCode = httpStatusCode || 400;
  return err;
};

// CREATES NEW POST
postsRouter.post("/", async (req, res, next) => {
  try {
    const newPost = new postModel(req.body);
    await newPost.save();
    res.status(201).send(newPost);
  } catch (error) {
    next(await errorHandler(error));
  }
});

// RETREIVES POSTS
postsRouter.get("/", async (req, res, next) => {
  try {
    const posts = await postModel.find().populate("user");
    res.status(200).send(posts);
  } catch (error) {
    next(await errorHandler(error));
  }
});

// RETREIVES THE SPESIFIC POST
postsRouter.get("/:id", async (req, res, next) => {
  try {
    const post = await postModel.findById(req.params.id);
    res.status(200).send(post);
  } catch (error) {
    next(await errorHandler(error));
  }
});

// DELETES THE POST
postsRouter.delete("/:id", async (req, res, next) => {
  try {
    const postToDelete = await postModel.findByIdAndDelete(req.params.id);
    if (!postToDelete || Object.values(postToDelete).length === 0) {
      const error = new Error(`There is no post with id ${req.params.id}`);
      error.httpStatusCode = 404;
      next(error);
    } else {
      res.status(204).send(postToDelete);
    }
  } catch (error) {
    next(await errorHandler(error));
  }
});

// EDIT POST
postsRouter.put("/:id", async (req, res, next) => {
  try {
    const postToUpdate = await postModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { runValidators: true, new: true }
    );
    if (postToUpdate) {
      res.status(204).send(postToUpdate);
    } else {
      const error = new Error(`Post with id:${req.params.id} not found.`);
      error.httpStatusCode = 404;
      next(error);
    }
  } catch (error) {
    next(await errorHandler(error));
  }
});

//ADD IMG TO THE POST
const storage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "instagramPost" },
});

const cloudinaryStorage = multer({ storage: storage });

postsRouter.post(
  "/:id/picture",
  cloudinaryStorage.single("image"),
  async (req, res, next) => {
    try {
      const path = req.file.path;
      let post = await postModel.findByIdAndUpdate(
        req.params.id,
        { image: path },
        { runValidators: true, new: true }
      );
      res.status(201).send({ message: "Post picture is uploaded" });
    } catch (error) {
      next(await errorHandler(error));
    }
  }
);

module.exports = postsRouter;