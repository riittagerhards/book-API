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
app.get('/api/books/:ISBN', async (request, response) => {
  const bookCollection = getBookCollection();
  const singleBook = request.params.ISBN;
  const bookRequest = await bookCollection.findOne({ ISBN: singleBook });
  if (!bookRequest) {
    response.status(404).send('Unknown titel');
  } else {
    response.send(bookRequest);
  }
});

//add a new chart of books first version
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

//add a new chart of books with check
app.post('/api/books', async (request, response) => {
  const bookCollection = getBookCollection();
  const newBooks = request.body.books;
  let newBooksCount = 0;
  const promises = newBooks.map(async (book: Record<string, unknown>) => {
    //console.dir(book);
    const bookFound = await bookCollection.findOne({ title: book.title });
    try {
      if (bookFound) {
        console.dir(`Book ${book} not added`);
        //response.status(404).send('Failed');
      } else {
        bookCollection.insertOne(book);
        newBooksCount++;
        console.dir(`Book ${book} added`);
        //response.status(101).send('Book added');
        //console.dir(bookFound);
      }
    } catch (error) {
      console.dir(error);
    }
  });
  await Promise.all(promises);
  response.send(`Inserted ${newBooksCount} books`);
});

//add a single new book
app.post('/api/books/:ISBN', async (request, response) => {
  const bookCollection = getBookCollection();
  const newBook = request.body;
  const findBook = request.body.ISBN;
  const doesBookExist = await bookCollection.findOne({ ISBN: findBook });
  if (doesBookExist) {
    response.status(400).send(`Book ${newBook.title} already exists`);
    return;
  }
  await bookCollection.insertOne(newBook);
  response.status(200).send(`Book ${newBook.title} added to collection`);
});

//delete one book
app.delete('/api/books/:ISBN', async (request, response) => {
  const bookCollection = getBookCollection();
  const bookToRemove = request.params.ISBN;
  const findBook = await bookCollection.findOne({ ISBN: bookToRemove });
  if (findBook) {
    await bookCollection.deleteOne(findBook);
    response.send(`Book ISBN number ${bookToRemove} deleted`);
  } else {
    response.status(404).send('This chart doesnt contain your title');
  }
});

//update book information
app.patch('/api/books/:ISBN', async (request, response) => {
  const bookCollection = getBookCollection();
  const bookToUpdate = request.params.ISBN;
  const newFiel = request.body;
  const update = await bookCollection.findOneAndUpdate({ ISBN: bookToUpdate }, [
    { $set: newFiel },
  ]);
  if (!update) {
    response.send('This chart doesnt contain your title');
  }
  response
    .status(200)
    .send(`Update done for book with ISBN number ${bookToUpdate}`);
});

app.get('/', (_req, res) => {
  res.send('Hello Bookworld!');
});

connectDatabase(process.env.MONGODB_URI).then(() =>
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  })
);
