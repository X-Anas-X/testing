'use strict';

const express = require('express');
const cors = require('cors');
const pg = require('pg');

const superagent = require('superagent');
const app = express();
const methodOverride = require('method-override');
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));


// routes
app.get('/', homePage);
app.get('/new', formSearch);
app.post('/searches', searchResult);
app.get('/books/:bookID', bookDetails);
app.post('/books', addBook);
app.put('/books/:bookID', editBook);
app.delete('/books/:bookID', deleteBook);

function homePage(req, res) {
  let SQL = `SELECT * FROM booklist;`;
  client
    .query(SQL)
    .then(allbooks => {
      res.render('pages/index', { booklist: allbooks.rows });
    })
    .catch(err => console.log(err));
}

function bookDetails(req, res) {
  let SQL = `SELECT * from booklist WHERE id=${req.params.bookID};`;
  client
    .query(SQL)
    .then(result => {
      res.render('pages/books/show', { book: result.rows[0] });
    })
    .catch(err => err);
}

function formSearch(req, res) {
  res.render('pages/searches/new');
}

//search function
function searchResult(req, res) {
  let url;
  let input = req.body.search;
  if (req.body.searchBy === 'title') {
    url = `https://www.googleapis.com/books/v1/volumes?q=${input}+intitle;`;
  }
  if (req.body.searchBy === 'author') {
    url = `https://www.googleapis.com/books/v1/volumes?q=${input}+inauthor`;
  }
  superagent
    .get(url)
    .then(bookApiData => bookApiData.body.items.map(item => new Book(item)))
    .then(element => {
      res.render('pages/searches/show', { books: element });
    })
    .catch(err => console.log(err));
}

// Add book to database
function addBook(req, res) {
  let SQL = `INSERT INTO booklist (title, author, description, img, isbn, shelf)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id;`;
  let values = [
    req.body.title,
    req.body.author,
    req.body.description,
    req.body.img,
    req.body.isbn,
    req.body.shelf,
  ];
  client
    .query(SQL, values)
    .then(result => {
      res.redirect(`/books/${result.rows[0].id}`);
    })
    .catch(err => console.log(err));
}

function Book(data) {
  this.title = data.volumeInfo.title || 'not available';
  this.authors =
    data.volumeInfo.author !== undefined
      ? data.volumeInfo.authors
      : 'not available';
  this.description = data.volumeInfo.description || 'not available';
  this.img = data.volumeInfo.imageLinks.thumbnail || 'not available';
  this.isbn = data.volumeInfo.industryIdentifiers
    ? data.volumeInfo.industryIdentifiers[0].identifier
    : `Unknown ISBN`;
  this.shelf = data.volumeInfo.categories || `The book is not in a shelf`;
}

function editBook(req, res) {
  console.log(req.body);
  let SQL = `UPDATE books SET title=$1, author=$2, description=$3, img=$4, isbn=$5, shelf=$6 WHERE id=$7;`
  let safeValues = [
    req.body.title,
    req.body.author,
    req.body.description,
    req.body.img,
    req.body.isbn,
    req.body.shelf,
    req.params.bookID];
  client
    .query(SQL, safeValues)
    .then(() => {
      res.redirect(`/books/${req.params.bookID}`);
    })
    .catch(err => {
      res.render('pages/error', { error: err });
    });
}

function deleteBook(req, res) {
  let SQL = `DELETE FROM booklist WHERE id=$1;`;
  let safeValue = [req.params.bookID];
  client
    .query(SQL, safeValue)
    .then(() => {
      res.redirect('/');
    })
    .catch(err => {
      res.render('pages/error', { error: err });
    });
}

client.connect().then(() => {
  app.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
  });
});
