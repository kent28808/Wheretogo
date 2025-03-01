require('dotenv').config();
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const yelp = require('yelp-fusion');

// Yelp fusion setup with better error handling
let client;
try {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
        throw new Error('YELP_API_KEY environment variable is not set');
    }
    
    // Remove any whitespace from the API key
    const cleanApiKey = apiKey.trim();
    
    // Initialize the client with the API key
    client = yelp.client(cleanApiKey, {
        // Add additional options if needed
        axiosOptions: {
            headers: {
                'Authorization': `Bearer ${cleanApiKey}`,
                'Accept': 'application/json',
            }
        }
    });
    console.log('Yelp client initialized successfully');
} catch (error) {
    console.error('Failed to initialize Yelp client:', error);
}

//Yelp API call to get restaurant results
router.post('/results', async (req, res) => {
    try {
        console.log('Received search request:', req.body);

        if (!client) {
            throw new Error('Yelp client not initialized');
        }

        if (!req.body.location) {
            return res.status(400).json({
                error: 'Location is required'
            });
        }

        const searchRequest = {
            term: 'restaurants',
            location: req.body.location,
            limit: 12,
            sort_by: 'rating'
        };

        console.log('Making Yelp API request with:', searchRequest);
        
        const response = await client.search(searchRequest);
        
        if (!response.jsonBody || !response.jsonBody.businesses) {
            throw new Error('Invalid response from Yelp API');
        }

        const { businesses, total } = response.jsonBody;
        console.log(`Found ${businesses.length} of ${total} total businesses`);
        
        res.json({
            businesses,
            total,
            region: response.jsonBody.region
        });
        
    } catch (error) {
        console.error('Yelp API Error:', error);
        console.error('Error stack:', error.stack);
        
        // Send appropriate error response
        if (error.message.includes('not initialized')) {
            res.status(500).json({
                error: 'Server configuration error',
                details: 'Yelp API client not properly configured'
            });
        } else if (error.statusCode === 400) {
            res.status(400).json({
                error: 'Invalid request',
                details: error.message,
                response: error.response?.body // Include the response body for debugging
            });
        } else {
            res.status(500).json({
                error: 'Failed to fetch results',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
});

//POST - save restaurant to db for user profile
router.post('/results/restaurantsaved', function (req, res) {
    var userId = req.body.user.id;
    User.findById(userId)
        .exec(function (err, foundUser) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else {
                foundUser.restaurant.push({
                    "name": req.body.business.name,
                    "url": req.body.business.url,
                    "imgurl": req.body.business.image_url,
                    "rating": req.body.business.rating,
                    "category": req.body.business.categories[0].title
                });
                foundUser.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                res.json(foundUser);
            }
        });
});

// GET user profile with saved restaurants
router.get('/profile/:id', function (req, res) {
    User.findById(req.params.id)
        .exec(function (err, user) {
            if (err) { return console.log('error', err); }
            res.send(user);
        });
});

// POST packing list item to user db
router.post('/profile/list/:userId', function (req, res) {
    var { userId } = req.params;
    var items = req.body.list;
    User.findById(userId)
        .exec(function (err, foundUser) {
            if (err) {
                res.status(500).json({ error: err.message });
            } else { //TODO check for duplicates!
                foundUser.list = items && items.length ? items : [];
                foundUser.save(function (err) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                });
                res.json(foundUser);
            }
        });
});

// DELETE packing list item from user db
router.delete('/profile/list/:userId', function (req, res) {
    const { userId } = req.params;
    User.findById(userId, function (err, user) {
        User.update({ _id: userId }, {
            $set: {
                "list": req.body.list
            }
        }, function (err, user) {
            if (err) console.log("error", err);
            res.json(user);
        });
    });
});


module.exports = router;