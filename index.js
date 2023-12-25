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
        'http://localhost:5174',
        'https://65788bedeb8e3103a2b2f66e--tiny-starship-dca274.netlify.app',
        'https://654cd5cfb5dcf737fa94267f--superlative-lokum-c289a2.netlify.app'
        ],
    credentials:true
}));
app.use(express.json());
app.use(cookieParser())

const verify = async(req, res, next)=>{
    const token = req.cookies?.token;
    if(!token){
        return res.status(401).send({message: 'not Authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
        if(err){
            console.log(err)
            return res.status(401).send({message: 'unauthorized'})
        }
        // console.log('value of token is', decoded)
        req.user = decoded
        next()
    })
}


// MONGODB


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gx7mkcg.mongodb.net/?retryWrites=true&w=majority`;

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
const reviewsCollection = client.db("assignmentsDB").collection("reviews");

// GET POST PATCH DELETE

app.get('/', (req, res) => {
    res.send('Assignment time running out')
})

// JWT
app.post('/jwt', (req, res)=>{
    const user = req.body
    console.log('from jwt', user)

    // Creating Token
    const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
    // storing in cookies
    res
    .cookie('token', token, {
        httpOnly : false ,
        secure : true,
        sameSite:'none'
    })
    .send(success = true)
})


app.post('/logout', async (req, res) => {
    const user = req.body;
    console.log('logging out', user);
    res
    .clearCookie('token', { 
        maxAge: 0,
        sameSite: "none",
        secure: true
    })
    .send('logged out')
})

// ASSIGNMENTS
app.get('/assignments', async(req, res)=>{
    let query = {}
    if(req.query?.email){
        query = {email: req.query.email}
    }else if(req.query?.subject){
        query = {subject: req.query.subject}
    }
    else if(req.query?.difficulty){
        query = {difficulty: req.query.difficulty}

    }
    const assignments = await assignmentsCollection.find(query).toArray()
    res.send(assignments)
})

app.get('/reviews', async(req, res)=>{
    
    const assignments = await reviewsCollection.find().toArray()
    res.send(assignments)
})

app.get('/assignments/:id', async(req, res)=>{
    
    const id = req.params.id
    const query = {_id : new ObjectId(id)}
    const assignment = await assignmentsCollection.findOne(query)
    res.send(assignment)
})

app.get('/assignmentsCount', async (req, res) => {
    const count = await assignmentsCollection.estimatedDocumentCount();
    res.send({ count });
  })

 app.get('/pagination', async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await assignmentsCollection.find()
      .skip(page * size)
      .limit(size)
      .toArray();
      res.send(result);
    })


app.post('/assignments', verify, async(req, res)=>{
    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    const assignment = req.body
    const result = await assignmentsCollection.insertOne(assignment)
    console.log(result)
    res.send(result)
})

app.put('/assignments', verify, async(req, res)=>{

    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    const id = req.query._id
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
      description: updatedAssignment.description,
      subject: updatedAssignment.subjectV  
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

app.get('/submitted', verify,  async(req, res)=>{
 
    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    query = {status: 'pending'}
    const assignments = await submittedAssignmentsCollection.find(query).toArray()
    res.send(assignments)
})

app.post('/submitted', verify,  async(req, res)=>{
    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    const assignment = req.body;
    const result = await submittedAssignmentsCollection.insertOne(assignment)
    res.send(result)
})

app.patch('/submitted', verify, async (req, res) => {
    console.log(req.query?.email, req.user?.email)
    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    const id = req.query.id;
    console.log(id)
    const filter = { _id: new ObjectId(id) };
    const updatedSubmittedAssignment = req.body;
    console.log(updatedSubmittedAssignment.status)
    const updateDoc = {
        $set: {
            status: updatedSubmittedAssignment.status,
            obtained_marks: updatedSubmittedAssignment.Mark,
            feedback: updatedSubmittedAssignment.Feedback
        },
    };
    const result = await submittedAssignmentsCollection.updateOne(filter, updateDoc);
    res.send(result);
})

app.get('/myAssignments',verify, async(req, res)=>{
    if(req.query?.email !== req.user?.email){
        return res.status(403).send({message: 'forbidden access'})

    }
    let query = {}
    if(req.query?.email){
        query = {email: req.query.email}
    }
    const assignments = await submittedAssignmentsCollection.find(query).toArray()
    res.send(assignments)
})





app.listen(port, () => {
    console.log(`Assignment server running on ${port}`)
})