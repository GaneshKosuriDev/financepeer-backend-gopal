const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const cors = require("cors");
const databasePath = path.join(__dirname, "financePeer.db");

const app = express();

app.use(express.json());
app.use(cors());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    console.log(process.env.PORT);
    app.listen(process.env.PORT || 3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register/", async (request, response) => {
  const { username, password } = request.body;
  console.log("------------", username, password);
  const getUserQuery = `
      SELECT * FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const addUserQuery = `
      INSERT INTO user( username, password)
      VALUES(
          '${username}',
          '${hashedPassword}'
      );
    `;
    const dbResponse = await db.run(addUserQuery);
    response.send("New User Created");
  } else {
    response.status(400);
    response.send("username already exist");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
  const databaseUser = await db.get(selectUserQuery);

  if (databaseUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      databaseUser.password
    );
    if (isPasswordMatched === true) {
      const data = {
        jwt_token:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
      };
      response.send(data);
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.post("/posts/", async (request, response) => {
  const { user_id, id, title, body } = request.body;
  const query = `INSERT INTO
        post (user_id,id, title,body)
    VALUES
        (${user_id},${id},'${title}','${body}');`;
  const userData = await db.run(query);
  response.send("Successfully added");
});

app.get("/getPosts/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      post;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray);
});
