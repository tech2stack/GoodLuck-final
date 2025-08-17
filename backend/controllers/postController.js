// backend/controllers/postController.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Post = require('../models/Post');

// A function to initialize default posts
const initializeDefaultPosts = async () => {
    const defaultPosts = [
        { name: 'Sales Representative', isDeletable: false },
        { name: 'Store Manager', isDeletable: false },
        { name: 'Stock Manager', isDeletable: false },
        { name: 'Area Manager', isDeletable: false },
        { name: 'Human Resource (HR)', isDeletable: false },
        { name: 'Technical Manager', isDeletable: false },
        { name: 'Driver', isDeletable: false },
        { name: 'Sweeper', isDeletable: false },
        { name: 'Helper', isDeletable: false },
        { name: 'Assistant', isDeletable: false },
        { name: 'Transport Manager', isDeletable: false },
        { name: 'Receptionist', isDeletable: false }
    ];

    for (const post of defaultPosts) {
        try {
            await Post.findOneAndUpdate({ name: post.name }, post, { upsert: true, new: true, runValidators: true });
        } catch (err) {
            console.error(`Error initializing post: ${post.name}`, err);
        }
    }
};

// Initialize the default posts when the server starts
initializeDefaultPosts();

exports.getAllPosts = catchAsync(async (req, res) => {
    const posts = await Post.find();
    res.status(200).json({ status: 'success', results: posts.length, data: { posts } });
});

exports.createPost = catchAsync(async (req, res, next) => {
    const { name } = req.body;
    if (!name) {
        return next(new AppError('Post name is required.', 400));
    }
    const newPost = await Post.create({ name });
    res.status(201).json({ status: 'success', data: { post: newPost } });
});

exports.updatePost = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { name, status } = req.body;
    const post = await Post.findById(id);

    if (!post) {
        return next(new AppError('No post found with that ID.', 404));
    }

    if (!post.isDeletable) {
        return next(new AppError('This is a system post and cannot be updated.', 403));
    }

    const updatedPost = await Post.findByIdAndUpdate(id, { name, status }, { new: true, runValidators: true });
    res.status(200).json({ status: 'success', data: { post: updatedPost } });
});

exports.deletePost = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const post = await Post.findById(id);

    if (!post) {
        return next(new AppError('No post found with that ID.', 404));
    }

    if (!post.isDeletable) {
        return next(new AppError('This is a system post and cannot be deleted.', 403));
    }

    await Post.findByIdAndDelete(id);
    res.status(204).json({ status: 'success', data: null });
});