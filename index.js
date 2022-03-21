const express = require("express");
const { MongoClient } = require("mongodb");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5000;

//configure midleware cors
app.use(cors());
app.use(express.json());
//single data loading by objectId
const ObjectId = require("mongodb").ObjectId;
//connect to db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.uvy8c.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

//stripe related stuff

async function run() {
  try {
    await client.connect();
    const database = client.db("MyHospital");
    const doctorCollection = database.collection("doctorList");
    const appointmentCollection = database.collection("AppointmentList");
    //user collection db
    const usersCollection = database.collection("users");
    //API for getting  list data
    app.get("/doctors", async (req, res) => {
      const cursor = doctorCollection.find({});
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let doctors;
      const count = await cursor.count();
      if (page) {
        doctors = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        doctors = await cursor.toArray();
      }

      res.send({ count, doctors });
    });

    //API for single data load
    app.get("/appointment/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };

      const appointment = await doctorCollection.findOne(query);
      res.json(appointment);
    });

    //API for submit place appointment
    app.post("/appointmentlist", async (req, res) => {
      const appointment = req.body;
      appointment.createdAt = new Date();
      const result = await appointmentCollection.insertOne(appointment);
      console.log("hiot", appointment);
      res.json(result);
    });

    //save email pass auth data to mongodb
    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.json(result);
    });
    //save google data to mongodb
    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });
    //api for get appointment listfrom admin dashboard
    app.get("/appointments", async (req, res) => {
      const cursor = appointmentCollection.find({});
      const allAppointment = await cursor.toArray();
      res.send(allAppointment);
    });
    //API for delete a appointment
    app.delete("/appointments/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await appointmentCollection.deleteOne(query);
      res.json(result);
    });
    //api for make admin
    app.put("/users/admin", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const updateDoc = { $set: { role: "admin" } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      res.json(result);
    });
    //checking user is admin or not from user db
    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });
    console.log("db connected");
  } finally {
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
