DROP TABLE IF EXISTS books;

CREATE TABLE books(
    id  SERIAL PRIMARY KEY,
    author VARCHAR (200),
    title VARCHAR (200),
    bookshelf VARCHAR (200),
    isbn VARCHAR (200),
    image_url VARCHAR (200),
    description TEXT
)