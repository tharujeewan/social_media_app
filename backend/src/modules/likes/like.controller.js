'use strict';

const likeService = require('./like.service');
const { success } = require('../../utils/response');

const toggleLike = async (req, res, next) => {
  try {
    const data = await likeService.toggleLike(req.user.id, req.params.postId);
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getLikers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await likeService.getLikers(req.params.postId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

const getLikeStatus = async (req, res, next) => {
  try {
    const data = await likeService.getLikeStatus(req.user.id, req.params.postId);
    return success(res, { data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  toggleLike,
  getLikers,
  getLikeStatus,
};
