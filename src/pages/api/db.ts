// @ts-nocheck

import { MongoClient } from 'mongodb';

if (!process.env.NEXT_PUBLIC_MONGODB_USERNAME) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_USERNAME"');
}
if (!process.env.NEXT_PUBLIC_MONGODB_PASSWORD) {
  throw new Error(
    'Invalid/Missing environment variable: "NEXT_PUBLIC_MONGODB_PASSWORD"'
  );
}

const username = process.env.NEXT_PUBLIC_MONGODB_USERNAME;
const password = process.env.NEXT_PUBLIC_MONGODB_PASSWORD;
const uri = `mongodb+srv://${username}:${password}@cluster0.i0dtu6q.mongodb.net/sample_mflix?retryWrites=true&w=majority`;
// const uri = "mongodb+srv://prajwollucifer:AoMbpMmVXbAsXPTh@cluster0.i0dtu6q.mongodb.net/sample_mflix?retryWrites=true&w=majority"
// console.log(uri)
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default async (req, res) => {
  const client = await clientPromise;
  const myDB = client.db('posts');
  const myCollection = myDB.collection('posts');

  if (req.method === 'GET') {
    try {
      const posts = await myCollection.find({}).limit(10).toArray();
      res.json(posts);
    } catch (err) {
      res.status(405).json({
        status: 'failure',
        message: 'Error processing GET',
      });
    }
  } else if (req.method === 'POST') {
    try {
      // console.log(req.body.cid)
      console.log('Trying to insert');
      const post = req.body;
      console.log(post);
      console.log(typeof post);
      console.log(JSON.parse(post));
      const result = await myCollection.insertOne(JSON.parse(req.body));
      console.log(result);

      res.json(result);
    } catch (err) {
      res.status(405).json({
        status: 'failure',
        message: 'Error processing POST',
      });
    }
  } else {
    res.status(405);
    res.end();
  }
};
