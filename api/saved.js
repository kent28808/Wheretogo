import { Client } from 'yelp-fusion';
import mongoose from 'mongoose';
import User from '../models/user'; 

const apikey = process.env.apikey;
const client = new Client(apikey);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const searchRequest = {
        location: req.body.location,
        limit: 12,
      };

      const response = await client.search(searchRequest);
      const result = response.jsonBody;
      res.status(200).json(result); // Send the Yelp data as JSON response
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Failed to fetch data from Yelp API' });
    }
  } else {
    res.status(404).json({ error: 'Not Found' });
  }
}

