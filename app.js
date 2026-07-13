const express = require('express');
const cors = require('cors');
const {MongoClient} = require('mongodb');
const multer = require('multer');
const session = require('express-session');

const url = "mongodb://nnm24is097:nnm24is097@ac-tlg4mf9-shard-00-00.km6hqeo.mongodb.net:27017,ac-tlg4mf9-shard-00-01.km6hqeo.mongodb.net:27017,ac-tlg4mf9-shard-00-02.km6hqeo.mongodb.net:27017/?ssl=true&replicaSet=atlas-owm8ln-shard-0&authSource=admin&appName=Cluster0"; 

const app = express();

app.use(express.json());
app.use(cors());
app.set("view engine", "ejs");
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(session({
    secret: "1234", 
    resave: false, 
    saveUninitialized: false
}));

const upload = multer({storage:multer.memoryStorage()});

const client = new MongoClient(url);

async function main() {
    await client.connect();
    console.log("connected to the mongoDB");

    const db = client.db("college");
    const users = db.collection("users");
    const students = db.collection("students");

    //home router
    app.get('/',(request, response) => {
        response.render("login",{error:""});
    });

    app.post('/login', async(request,response) => {
        const email = request.body.email;
        const password = request.body.password;

        const user = await users.findOne({email:email, password:password});

        const student = await students.findOne({email: email, usn: password.toUpperCase()});

        if(user){
            response.redirect('/admin');
        }else if(student){
            request.session.student = student.usn;            response.redirect(`/student/${password.toUpperCase()}`);
        }else{
            response.render('login',{error:"Invalid credentials!"})
        }
        
    });

    app.get('/register', (request, response) => {
        response.render("signup", {error:""});
    });

    app.post('/register', async(request, response) => {
        const email = request.body.email;
        const password = request.body.password;
        const name = request.body.name;

        const existing = await users.findOne({email:email});
        if(existing){
            response.render("signup",{error:"user already exists!"});
        }else{
            await users.insertOne({
                name,
                email,
                password
            });
            response.send("Homepage");
        }
        
    });

    app.get('/admin', async(request, response) => {
        const data = await students.find().toArray();
        response.render('admin', { data: data })
    });

    app.get('/add', (request, response) => {
        response.render("add");
    });

    app.post('/add', upload.single("photo"),async(request, response) => {
        const usn = request.body.usn;
        const fullname = request.body.fullname;
        const email = request.body.email;
        const branch = request.body.branch;
        const sem = request.body.sem;
        const cgpa = request.body.cgpa;

        await students.insertOne({
            usn : usn,
            fullname : fullname,
            email: email,
            branch: branch,
            sem: sem,
            cgpa: cgpa,
            photo: request.file.buffer,
            contentType: request.file.mimetype
        });
        response.redirect('/admin');
    });

    app.get('/photo/:usn', async(request, response) => {
        const student = await students.findOne({usn: request.params.usn});
        if(!student){
            return response.send("student not found!!");
        }
        response.set("Content-Type", student.contentType);
        response.send(student.photo.buffer);
    });

    app.get('/delete/:usn',async(request, response) => {
        await students.deleteOne({usn:request.params.usn});
        response.redirect('/admin');
    });

    app.get('/edit/:usn', async(request, response) => {
        const student = await students.findOne({usn: request.params.usn});
        response.render("edit", {student : student});
    });

    app.post('/edit/:usn', upload.single('photo'),async(request, response) => {
        const data = {
            fullname : request.body.fullname,
            email : request.body.email,
            sem : request.body.sem,
            branch: request.body.branch,
            cgpa: request.body.cgpa
        }
        if(request.file){
            data.photo = request.file.buffer;
            data.contentType = request.file.mimetype;
        }

        await students.updateOne(
            {usn: request.params.usn},
            {
                $set: data
            }
        );
        response.redirect('/admin');
    });

    app.get('/result/:usn', async(request, response) => {
        const student = await students.findOne({usn:request.params.usn});

        response.render("result", {student});
    });

    app.post('/result/:usn', async(request, response) => {
        const sem = Number(request.body.semester);
        const result = {
            sem,
            subjects : [
                {
                   subject : request.body.sub1,
                   marks : Number(request.body.mark1)

                },
                {
                   subject : request.body.sub2,
                   marks : Number(request.body.mark2)

                },
                {
                   subject : request.body.sub3,
                   marks : Number(request.body.mark3)

                },
                {
                   subject : request.body.sub4,
                   marks : Number(request.body.mark4)

                },
                {
                   subject : request.body.sub5,
                   marks : Number(request.body.mark5)

                },
                {
                   subject : request.body.sub6,
                   marks : Number(request.body.mark6)
                }
            ],
            percentage: Number(request.body.percentage),
            cgpa: Number(request.body.cgpa),
            published: true
        };

        await students.updateOne(
            {usn: request.params.usn},
            {
                $push:{
                    results:result
                }
            }
        );
        response.redirect('/admin');
    });

    app.get('/student/:usn', async(request, response) => {
        const student = await students.findOne({usn:request.params.usn});
        response.render('student', {student});
    });

    app.get('/student/result/:sem', async(request, response) => {
        console.log(`session : ${request.session.student}`);
        const student = await students.findOne({usn:request.session.student});

        const sem = Number(request.params.sem);
        const result = await student.results.find((item) => item.sem === sem);
        response.render('semResult', {
            student,
            sem,
            result
        });
    });

    app.listen(5000, ()=> {
        console.log('App is running in port 5000')
    });
}
    

main();