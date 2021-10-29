import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

import { connectDatabase, getBookCollection } from './utils/database';
import { books } from './utils/content.json';

if (!process.env.MONGODB_URI) {
  throw new Error('No MongoDB URI dotenv variable');
}

const app = express();
const port = 3000;
const bookCharts = books;

app.use(express.json());

//get all books
app.get('/api/books', async (_request, response) => {
  const bookCollection = getBookCollection();
  const cursor = bookCollection.find();
  const allBooks = await cursor.toArray();
  response.status(200).send(allBooks);
});

//get a single book
app.get('/api/books/:titel', async (request, response) => {
  const bookCollection = getBookCollection();
  const singleBook = request.params.titel;
  const bookRequest = await bookCollection.findOne({ title: singleBook });
  if (!bookRequest) {
    response.status(404).send('Unknown titel');
  } else {
    response.send(bookRequest);
  }
});

//add a new chart of books
app.post('/api/books', async (request, response) => {
  const bookCollection = getBookCollection();
  const newBook = request.body;
  const doesBookExist = await bookCollection.findOne({
    title: newBook.title,
  });
  if (!doesBookExist) {
    await bookCollection.insertMany(bookCharts);
    response.status(200).send('Book chart added');
  } else {
    response.status(409).send('Book already exists');
  }
});

//add a single new book
app.post('/api/books', async (request, response) => {
  const bookCollection = getBookCollection();
  const newBook = request.body;
  const doesBookExist = await bookCollection.findOne({ title: newBook.title });
  if (!doesBookExist) {
    await bookCollection.insertOne(newBook);
    response.status(200).send(`${newBook.title} added`);
  } else {
    response.status(409).send('Book already exists');
  }
});

//delete one book
app.delete('/api/books/:title', async (request, response) => {
  const bookCollection = getBookCollection();
  const bookToRemove = request.params.title;
  const findBook = await bookCollection.findOne({ title: bookToRemove });
  if (findBook) {
    await bookCollection.deleteOne(findBook);
    response.send(`Book ${bookToRemove} deleted`);
  } else {
    response.status(404).send('This chart doesnt contain your title');
  }
});

app.get('/', (_req, res) => {
  res.send('Hello World!');
});

connectDatabase(process.env.MONGODB_URI).then(() =>
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  })
);
