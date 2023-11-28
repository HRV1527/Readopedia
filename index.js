import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
let sort = 1;
let newid=0;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Library",
  password: "harsh@1527",
  port: 5432,
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function bookSorting() {
  let a;
  if (sort == 1) {
    a = await db.query("SELECT * FROM books ORDER BY name ASC;");
    return a;
  } else if (sort == 2) {
    a = await db.query("SELECT * FROM books ORDER BY read_date DESC;");
    return a;
  } else {
    a = await db.query("SELECT * FROM books ORDER BY rating DESC;");
    return a;
  }
}

async function bookInfo() {
  let books = [];
  let img;
  const result = await bookSorting();
  // console.log(result);
  for (const book of result.rows) {
    img = "https://covers.openlibrary.org/b/isbn/" + book.bookid + "-L.jpg";
    books.push({
      id: book.id,
      name: book.name,
      read_date: book.read_date,
      rating: book.rating,
      summary: book.summary,
      url: book.url,
      author: book.author,
      image: img,
    });
  }
  // console.log(books);
  return books;
}

app.get("/", async (req, res) => {
  const books = await bookInfo();
  newid = books.length+1;
  res.render("index.ejs", {
    books: books
  });
});

app.get("/sort", (req, res) => {
  sort = parseInt(req.query.id);
  // console.log(sort);
  res.redirect("/");
});

app.get("/review", async (req, res) => {
  let id = parseInt(req.query.id);
  console.log(id);
  const result = await db.query(
    "SELECT b.id,b.name,to_char(b.read_date,'dd mon yyyy'),b.rating,b.summary,b.url,b.bookid,b.author,bi.abstract,bi.notes FROM books b JOIN bookinfo bi ON bi.book_id = b.id WHERE b.id = $1; ",
    [id]
  );
  console.log(result.rows);
  let book = result.rows;
  let img = "https://covers.openlibrary.org/b/isbn/"+book[0].bookid +"-L.jpg";
  res.render("review.ejs", {
    book: book,
    image: img
  });
});

app.get("/new",(req,res)=>{
    res.render("new.ejs");
});

app.post('/add',async (req,res)=>{
  let body = req.body;
  await db.query("INSERT INTO books VALUES (DEFAULT,$1,$2,$3,$4,$5,$6,$7)",[body.name,body.date,body.rating,body.summary,body.amazon,body.ISBN,body.author]);
  await db.query("INSERT INTO bookinfo VALUES (DEFAULT,$1,$2,$3)",[body.abstract,body.myNotes,newid]);
  res.redirect('/');
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
