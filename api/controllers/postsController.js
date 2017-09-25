/* eslint no-underscore-dangle: 0 */

// const Post = mongoose.model('Post');
const Post = require('../models/post');
// const Comment = mongoose.model('Comment');
const Comment = require('../models/comment');


const { sendResponse, sendMongoCatchResponse } = require('../utils/sendResponse');
const { newError } = require('../utils/errors');

const STATUS_USER_ERROR = 422;

/* Fill in each of the below controller methods */
const createPost = async (req, res) => {
  const { title, text } = req.body;
  if (title && text) {
    const newPost = await new Post({ title, text })
      .save()
      .catch(error => sendMongoCatchResponse(error, res));
    return sendResponse(newPost, res);
  }
  return sendResponse(newError('422', 'Missing title or text'), res);
};

const listPosts = async (req, res) => {
  const posts = await Post
    .find()
    .populate('comments', 'text')
    .catch(error => sendMongoCatchResponse(error, res));
  return sendResponse(posts, res);
};

const findPost = async (req, res) => {
  const { id } = req.params;
  const post = await Post
    .findById(id)
    .populate('comments', 'text')
    .catch(error => sendMongoCatchResponse(error, res));
  return sendResponse(post, res);
};

const addComment = async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const parent = await Post
    .findById(id)
    .catch(error => sendMongoCatchResponse(error, res));
  if (parent) {
    const newComment = await new Comment({ _parent: id, text })
    .save()
      .catch(error => sendMongoCatchResponse(error, res));
    if (newComment) {
      parent.comments.push(newComment._id);
      const updatedPost = await Post
        .findByIdAndUpdate({ _id: id }, parent)
        .catch(error => sendResponse(newError(422, error.message), res));
      return sendResponse(newComment, res);
    }
  }
};

// In this function, we need to delete the comment document
// We also need to delete the comment's parent post's reference
// to the comment we just deleted
const deleteComment = async (req, res) => {
  const { id, commentId } = req.params;
  const removedComment = await Comment
      .findByIdAndRemove(commentId)
      .catch(error => sendMongoCatchResponse(error, res));
  if (removedComment) {
    const post = await Post
      .findById(id)
      .catch(error => sendMongoCatchResponse(error, res));
    if (post) {
      post.comments = post.comments.filter(c => c !== commentId);
      const savedPost = await post
        .save()
        .catch(error => sendMongoCatchResponse(error, res));
      if (savedPost) {
        return sendResponse({
          success: 'Comment and references removed'
        }, res);
      }
    }
  }
};

// Similarly, in this function we need to delete the post document,
// along with any comments that are the children of this post
// We don't want any orphaned children in our database
const deletePost = async (req, res) => {
  const { id } = req.params;
  const post = await Post
    .findById(id)
    .catch(error => sendMongoCatchResponse(error, res));
  if (post) {
    const comments = post.comments;
    const removedComments = await Comment
      .remove({ _id: { $in: post.comments } })
      .catch(error => sendMongoCatchResponse(error, res));
    if (removedComments) {
      const removedPost = await Post
        .findByIdAndRemove(id)
        .catch(error => sendMongoCatchResponse(error, res));
      if (removedPost) {
        return sendResponse({
          success: 'Removed post and all associated comments'
        }, res);
      }
    }
    return sendResponse(newError(422, 'Could not remove comments for post'));
  }
  return sendResponse(newError(422, 'Could not find post to delete'));
};

module.exports = {
  createPost,
  listPosts,
  findPost,
  addComment,
  deleteComment,
  deletePost
};

