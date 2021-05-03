// Import packages
const express = require('express');
const cors = require('cors');
const pg = require('pg');

const superagent = require('superagent');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT || 3000;

const client = new pg.Client(process.env.DATABASE_URL);

app.use(cors());
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

// routes

app.get('/', homePage);
app.get('/new', formSearch);
app.post('/searches', searchResult);
app.get('/books/:bookID', bookDetails);
app.post('/books', addBook);

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

function Book(data) {
  this.title = data.volumeInfo.title || 'not available';
  this.authors =
    data.volumeInfo.author !== undefined
      ? data.volumeInfo.authors
      : 'not available';
  this.description = data.volumeInfo.description || 'not available';
  this.image = data.volumeInfo.imageLinks.smallThumbnail || 'not available';
  this.isbn = (data.volumeInfo.industryIdentifiers) ? data.volumeInfo.industryIdentifiers[0].identifier : `Unknown ISBN`;
  this.shelf = data.volumeInfo.categories || `The book is not in a shelf`;
}

function homePage(req, res) {
  let SQL = `SELECT * FROM booklist;`;
  client
    .query(SQL)
    .then(allbooks => {
      console.log(allbooks);
      res.render('pages/index', { booklist: allbooks.rows });
    })
    .catch(err => console.log(err));
}

function bookDetails(req, res) {
  console.log(req.params);
  let SQL = `SELECT * from booklist WHERE id=${req.params.bookID};`;
  client.query(SQL).then(result => {
    console.log(result);
    res.render('pages/detail', { book: result.rows[0] });
  });
}

function addBook(req, res) {
  let SQL = `INSERT INTO booklist (title, authors, description, img, isbn, shelf) VALUES($1,$2,$3,$4,$5,$6) RETURNING id;`;
  let SafeValues = [
    req.body.title,
    req.body.authors,
    req.body.description,
    req.body.img,
    req.body.isbn,
    req.body.shelf,
  ];
  client
    .query(SQL, SafeValues)
    .then(result => {
      console.log(result, 'kkkkkkkkkkkkkkkkkk`')
      res.redirect(`/books/${result.rows[0].id}`); //anas
    })
    .catch(err => console.log(err));
}

app.listen(PORT, () => {
  console.log(`THE SERVER IS LISTENING TO PORT ${PORT}`);
});
