const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");

app.use(cors());
const app = express();
dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const jwtSecret = `${process.env.JWT_SECRET}`;
const bearerSecret = `${process.env.BEARER_TOKEN}`;

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
    const jobsCollection = client.db("jobportal").collection("jobs");
    app.get("/", (req, res) => {
      res.send("App  running");
    });
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

    //   register
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

    // all jobs
    app.get("/jobs", async (req, res) => {
      const data = await jobsCollection.find().toArray();
      res.send(data);
    });
    //   Add jobs
    app.post("/jobs", async (req, res) => {
      const title = req.body.title;
      console.log(title);
      const result = await jobsCollection.insertOne({ title });
      res.send(result);
    });

    //  delete a  JOB
    app.delete("/removejobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await jobsCollection.deleteOne(query);
      res.send(result.data);
    });

    // update a  job
    app.put("/updatejobs/:id", async (req, res) => {
      const id = req.params.id;
      const updatedUser = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          title: updatedUser.title,
        },
      };
      const result = await jobsCollection.updateOne(query, updateDoc, options);
      res.send(result);
      console.log("updated");
    });

    // update jobs category child
    app.put("/updatechild/:id/:index", async (req, res) => {
      const id = req.params.id;
      const index = req.params.index;
      const { title } = req.body;
      const query = { _id: ObjectId(id) };
      const result = await jobsCollection.updateOne(query, {
        $set: { [`jobs.${index}`]: title },
      });
      res.send(result);
    });

    // delete jobs category child
    app.put("/deletechild/:id/:jobName", async (req, res) => {
      const id = req.params.id;
      const jobName = req.params.jobName;
      const query = { _id: ObjectId(id) };
      const result = await jobsCollection.findOneAndUpdate(query, {
        $pull: {
          jobs: jobName,
        },
      });
      res.send(result);
    });

    // delete jobs category child
    app.post("/addchild/:id", async (req, res) => {
      const id = req.params.id;
      const title = req.body.title;
      const query = { _id: ObjectId(id) };
      const result = await jobsCollection.findOneAndUpdate(query, {
        $addToSet: {
          jobs: title,
        },
      });
      res.send(result);
    });
  } catch {
    console.log("error");
  }
}

run().catch(() => {
  console.log("something went wrong");
});
app.listen(5000, () => {
  console.log("running server");
});
