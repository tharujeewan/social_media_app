// comment.controller.js
const commentService = require('./comment.service');
const { success } = require('../../utils/response');

const createComment = async (req, res, next) => {
  try {
    const data = await commentService.createComment(req.user.id, req.params.postId, req.body);

    return success(res, {
      data,
      message: 'Comment created successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
};

const getComments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await commentService.getComments(req.params.postId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getReplies = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await commentService.getReplies(req.params.postId, req.params.commentId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const updateComment = async (req, res, next) => {
  try {
    const data = await commentService.updateComment(req.user.id, req.params.commentId, req.body);

    return success(res, {
      data,
      message: 'Comment updated successfully',
    });
  } catch (err) {
    next(err);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    await commentService.deleteComment(req.user.id, req.params.commentId);

    return success(res, {
      message: 'Comment deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
};
