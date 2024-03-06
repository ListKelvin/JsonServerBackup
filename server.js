const fs = require("fs");
const bodyParser = require("body-parser");
const jsonServer = require("json-server");
const jwt = require("jsonwebtoken");

const server = jsonServer.create();

const router = jsonServer.router("./db.json");

const db = JSON.parse(fs.readFileSync("./db.json", "UTF-8"));

const middlewares = jsonServer.defaults();
const PORT = process.env.PORT || 3030;

server.use(middlewares);

server.use(jsonServer.defaults());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());

const SECRET_KEY = "123456789";
const expiresIn = "1h";

function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) =>
    decode !== undefined ? decode : err
  );
}

function isAuthenticated({ email, password }) {
  return (
    db.users.findIndex(
      (user) => user.email === email && user.password === password
    ) !== -1
  );
}

function isBookExist(bookId) {
  return (
    db.books.findIndex((book) => book.id == bookId && book.available) !== -1
  );
}

//register
server.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  let exist_user = db.users.findIndex((x) => x.email === email);

  if (exist_user !== -1) {
    return res.status(401).json({
      status: 401,
      message: "Email already in use!",
    });
  }

  const new_user = {
    id: db.users.length + 1,
    username,
    email,
    password,
  };

  db.users.push(new_user);
  fs.writeFileSync("./db.json", JSON.stringify(db), () => {
    if (err) return console.log(err);
    console.log("writing to " + fileName);
  });
  res.status(201).json({
    status: 201,
    message: "Success",
    data: new_user,
  });
});

//login
server.post("/login", (req, res) => {
  // const {email, password} = req.body
  const email = req.body.email;
  const password = req.body.password;

  if (isAuthenticated({ email, password }) === false) {
    const status = 401;
    const message = "Incorrect email or password";
    res.status(status).json({ status, message });
    return;
  }
  const access_token = createToken({ email, password });
  res.status(200).json({
    status: 200,
    message: "Success",
    data: {
      email: email,
      access_token,
    },
  });
});

//auth
server.use("/auth", (req, res, next) => {
  if (
    req.headers.authorization == undefined ||
    req.headers.authorization.split(" ")[0] !== "Bearer"
  ) {
    const status = 401;
    const message = "Bad authorization header";
    res.status(status).json({ status, message });
    return;
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(" ")[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401;
      const message = "Error: access_token is not valid";
      res.status(status).json({ status, message });
      return;
    }
    next();
  } catch (err) {
    const status = 401;
    const message = "Token is our of date.";
    res.status(status).json({ status, message });
  }
});

//view all users
server.get("/auth/users", (req, res) => {
  res.status(200).json({
    status: 200,
    data: {
      users: db.users,
    },
  });
});

//view user by email
server.get("/auth/users/:email", (req, res) => {
  const email = req.params.email;

  const exist_email = db.users.findIndex((user) => user.email == email);
  const result = db.users.filter((user) => user.email == email);
  if (exist_email !== -1) {
    const status = 200;
    return res.status(status).json({ status, result });
  } else {
    return res.status(401).json({
      status: 401,
      message: "Email is not found!!",
    });
  }
});

// syllabus
server.get("/syllabus", (req, res) => {
  res.status(200).json({
    status: 200,
    data: {
      syllabus: db.syllabus,
    },
  });
});
server.post("/syllabus", (req, res) => {
  const { sylla, createdBy } = req.body;

  if (book) {
    const status = 200;

    const newOrder = {
      id: db.orders.length + 1,
      bookId: bookId,
      customerName: customerName,
      quantity: 1,
      timestamp: new Date().getTime(),
    };

    db.orders.push(newOrder);

    fs.writeFileSync("./db.json", JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log("writing to " + fileName);
    });
    const message = "Order created successfully";

    const data = {
      created: true,
      orderId: newOrder.id,
    };

    return res.status(status).json({ status, message, data });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Book is not found!!",
    });
  }
});
//DO SOMETHING
//View all books
server.get("/books", (req, res) => {
  res.status(200).json({
    status: 200,
    data: {
      books: db.books,
    },
  });
});

// view books by id
server.get("/books/:bookId", (req, res) => {
  const bookId = req.params.bookId;
  const result = db.books.find((book) => book.id == bookId);

  if (result !== -1) {
    const status = 200;
    return res.status(status).json({ status, result });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Book is not found!!",
    });
  }
});
// Order A Book
server.post("/orders", (req, res) => {
  const { bookId, customerName } = req.body;

  const book = isBookExist(bookId);

  if (book) {
    const status = 200;

    const newOrder = {
      id: db.orders.length + 1,
      bookId: bookId,
      customerName: customerName,
      quantity: 1,
      timestamp: new Date().getTime(),
    };

    db.orders.push(newOrder);

    fs.writeFileSync("./db.json", JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log("writing to " + fileName);
    });
    const message = "Order created successfully";

    const data = {
      created: true,
      orderId: newOrder.id,
    };

    return res.status(status).json({ status, message, data });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Book is not found!!",
    });
  }
});

// get order by id
server.get("/orders/:orderId", (req, res) => {
  const oderId = req.params.orderId;
  const result = db.orders.find((order) => order.id == oderId);

  if (result !== -1) {
    const status = 200;
    return res.status(status).json({ status, result });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Order is not found!!",
    });
  }
});
//View all order
server.get("/orders", (req, res) => {
  res.status(200).json({
    status: 200,
    data: {
      orders: db.orders,
    },
  });
});
//Update orders
server.patch("/orders/:orderId", (req, res) => {
  const oderId = req.params.orderId;
  const customerName = req.body.customerName;
  let result = db.orders.find((order) => order.id == oderId);

  if (result !== -1) {
    let newDB = db.orders.map((order) => {
      if (order.id == oderId) {
        order.customerName = customerName;
      }
      return order;
    });
    db.orders = newDB;

    fs.writeFileSync("./db.json", JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log("writing to " + fileName);
    });
    const status = 204;

    return res.status(status).json({ status, result });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Order is not found!!",
    });
  }
});
//delete order
server.delete("/orders/:orderId", (req, res) => {
  const oderId = req.params.orderId;

  let result = db.orders.findIndex((order) => order.id == oderId);

  if (result !== -1) {
    db.orders = db.orders.filter((order) => {
      return order.id != oderId;
    });

    fs.writeFileSync("./db.json", JSON.stringify(db), () => {
      if (err) return console.log(err);
      console.log("writing to " + fileName);
    });

    return res.status(204).json({
      status: 204,
      message: "Success",
      data: "Delete successfully",
    });
  } else {
    return res.status(400).json({
      status: 400,
      message: "Order is not found!!",
    });
  }
});

//delete user by email
server.delete("/users/:email", (req, res) => {
  const email = req.params.email;
  const existEmail = db.users.find((user) => user.email === email);
  if (!existEmail) {
    return res.status(400).json({
      status: 400,
      message: "User is not found!!",
    });
  }
  db.users = db.users.filter((user) => user.email != email);
  fs.writeFileSync("./db.json", JSON.stringify(db), () => {
    if (err) return console.log(err);
    console.log("writing to " + fileName);
  });
  res.status(204).json({
    status: 200,
    message: "Success",
    data: "Delete successfully",
  });
});

//END

server.use(router);

server.listen(PORT, () => {
  console.log("Run Auth API Server");
});
