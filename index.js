const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174'
        ],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())


// MONGODB


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gx7mkcg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const dbConnect = async () => {
    try {
        await client.connect();
        console.log("Database Connected successfully ✅");
    } catch (error) {
        console.log(error.name, error.message);
    }
  }
  dbConnect();

// MONGO COLLECTIONS

const assignmentsCollection = client.db("assignmentsDB").collection("assignments");
const submittedAssignmentsCollection = client.db("assignmentsDB").collection("submitted");

// GET POST PATCH DELETE

app.get('/', (req, res) => {
    res.send('Assignment time running out')
})

// ASSIGNMENTS
app.get('/assignments', async(req, res)=>{
    let query = {}
    if(req.query?.email){
        query = {email: req.query.email}
    }
    const assignments = await assignmentsCollection.find(query).toArray()
    res.send(assignments)
})
app.get('/assignments/:id', async(req, res)=>{
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const assignment = await assignmentsCollection.findOne(query)
    res.send(assignment)
})

app.post('/assignments', async(req, res)=>{
    const assignment = req.body
    const result = await assignmentsCollection.insertOne(assignment)
    console.log(result)
    res.send(result)
})

app.put('/assignments/:id', async(req, res)=>{
    const id = req.params.id
  const query = {_id: new ObjectId(id)}
  const options = { upsert: true };
  const updatedAssignment = req.body
  const assignment = {
    $set:{
      title: updatedAssignment.title,
      photo: updatedAssignment.photo,
      difficulty: updatedAssignment.difficulty,
      date: updatedAssignment.date,
      mark: updatedAssignment.mark,
      description: updatedAssignment.description   
    }
  }
  const result = await assignmentsCollection.updateOne(query, assignment, options)
      res.send(result)
})

app.delete('/assignments/:id', async(req, res)=>{
    const id = req.params.id
    const query = {_id: new ObjectId(id)}
    const result = await assignmentsCollection.deleteOne(query);
    res.send(result)
})

// Submitted assignments

app.post('/submitted', async(req, res)=>{
    const assignment = req.body;
    const result = await submittedAssignmentsCollection.insertOne(assignment)
    res.send(result)
})



app.listen(port, () => {
    console.log(`Assignment server running on ${port}`)
})