const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");

const app = express();
dotenv.config();
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));

const jwtSecret = `${process.env.JWT_SECRET}`;

const uri = `mongodb+srv://jobportal:${process.env.MONGO_BD_SECRET}@cluster0.lqyezba.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const userCollection = client.db("jobportal").collection("user");

    //    login user
    app.post("/user-login", async (req, res) => {
      const { email, password } = req.body;
      const user = await userCollection.findOne({ email });
      const token = jwt.sign({ email: user.email }, jwtSecret);
      if (!user) {
        return res.json({ error: "user not found" });
      }
      if (password === user.password) {
        return res.json({ token, status: "ok" });
      } else {
        return res.json({ error: "password don't match" });
      }
    });

    //   user data by login with token
    app.post("/userData", (req, res) => {
      const { token } = req.body;
      try {
        const user = jwt.verify(token, jwtSecret);
        const userEmail = user.email;
        userCollection
          .findOne({ email: userEmail })
          .then((data) => {
            res.send({ satus: "ok", data });
          })
          .catch((error) => {
            res.send({ status: "error", data: error });
          });
      } catch {}
    });

    //   added user  info to database
    app.post("/user", async (req, res) => {
      const userInfo = req.body;
      const email = userInfo.email;
      const oldUser = await userCollection.findOne({ email });
      if (oldUser) {
        console.log("old user");
        return res.json({ error: "user Exists" });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });
  } catch {}
}

run().catch(() => {
  console.log("something went wrong");
});
app.listen(5000, () => {
  console.log("running server");
});
