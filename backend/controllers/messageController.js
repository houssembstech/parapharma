import Message from '../models/Message.js';
import User from '../models/User.js';
import asyncHandler from 'express-async-handler';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.user._id;

  const chatId = [senderId, receiverId].sort().join('_');

  const message = new Message({
    sender: senderId,
    receiver: receiverId,
    content,
    chatId
  });

  await message.save();
  await message.populate('sender', 'name email');
  await message.populate('receiver', 'name email');

  res.status(201).json(message);
});

// @desc    Get all messages in a chat
// @route   GET /api/messages/:userId
// @access  Private
export const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user._id;

  const chatId = [currentUserId, userId].sort().join('_');

  const messages = await Message.find({ chatId })
    .sort({ timestamp: 1 })
    .populate('sender', 'name email')
    .populate('receiver', 'name email');

  // Mark messages as read
  await Message.updateMany(
    { 
      chatId, 
      receiver: currentUserId, 
      isRead: false 
    },
    { 
      $set: { isRead: true } 
    }
  );

  res.json(messages);
});

// @desc    Get all chats for current user
// @route   GET /api/messages/chats
// @access  Private
export const getChats = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId }
        ]
      }
    },
    {
      $sort: { timestamp: -1 }
    },
    {
      $group: {
        _id: '$chatId',
        lastMessage: { $first: '$content' },
        timestamp: { $first: '$timestamp' },
        unreadCount: {
          $sum: {
            $cond: [
              { 
                $and: [
                  { $eq: ['$receiver', currentUserId] },
                  { $eq: ['$isRead', false] }
                ]
              },
              1,
              0
            ]
          }
        },
        partner: {
          $first: {
            $cond: [
              { $eq: ['$sender', currentUserId] },
              '$receiver',
              '$sender'
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'partner',
        foreignField: '_id',
        as: 'partnerDetails'
      }
    },
    {
      $unwind: '$partnerDetails'
    },
    {
      $sort: { timestamp: -1 }
    }
  ]);

  res.json(chats);
});

// @desc    Get unread messages count
// @route   GET /api/messages/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const unreadCount = await Message.countDocuments({
    receiver: currentUserId,
    isRead: false
  });

  res.json({ unreadCount });
});