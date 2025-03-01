import mongoose from 'mongoose';
import User from '../../../models/user';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { business, user } = req.body;
    
    // Add your logic here to save the restaurant to the user's saved items
    // Example:
    // await User.findByIdAndUpdate(user.id, {
    //   $push: { savedRestaurants: business }
    // });
    
    res.status(200).json({ success: true, message: 'Restaurant saved successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 