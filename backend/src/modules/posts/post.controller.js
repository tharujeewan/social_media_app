// post.controller.js
const postService = require('./post.service');
const { success } = require('../../utils/response');

const createPost = async (req, res, next) => {
  try {
    const data = await postService.createPost(req.user.id, req.body, req.file);

    return success(res, {
      data,
      message: 'Post created successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const getPostById = async (req, res, next) => {
  try {
    const data = await postService.getPostById(req.params.id);

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getAllPosts = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await postService.getAllPosts({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    // Fetch interests if available on req.user or default to empty array
    const userInterestIds = req.user.interests || [];
    const data = await postService.getFeed(userInterestIds, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const searchPosts = async (req, res, next) => {
  try {
    const { query, page, limit } = req.query;
    const data = await postService.searchPosts(query, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const data = await postService.updatePost(
      req.user.id,
      req.params.id,
      req.body
    );

    return success(res, {
      data,
      message: 'Post updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    await postService.deletePost(req.user.id, req.params.id);

    return success(res, {
      message: 'Post deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPost,
  getPostById,
  getAllPosts,
  getFeed,
  searchPosts,
  updatePost,
  deletePost,
};