const url = "mongodb+srv://jatinkumarsahu:jatinkumarsahu @cluster0.d6zae67.mongodb.net/?appName=Cluster0"; 
const {MongoClient} = require('mongodb');

async function main() {
    
    const client = new MongoClient(url);
    await client.connect();
    console.log('Connected to the client');

    const db = client.db("college");
    const students = db.collection("students");


   /* await students.insertOne(
        {
           fullname : "Nishan",
           usn : "NNM24IS201",
           sem : 5,
           cgpa: 7.09 
        }
    );

    await students.insertMany([
        {
            fullname : "Sohan",
           usn : "NNM24CS103",
           sem : 5,
           cgpa: 8.09 
        },
        {
            fullname : "Ananya",
           usn : "NNM24CS003",
           sem : 5,
           cgpa: 8.91 
        },
        {
            fullname : "Prastuthi",
           usn : "NNM24CS073",
           sem : 5,
           cgpa: 9.09 
        }
    ]);
    console.log('Data has been inserted');
*/
 
    await students.updateOne(
        {usn:"NNM24CS103"},
        {
            $set: {
               cgpa : 9.01,
               sem:6 
            }
        }
    );

    const row = await students.findOne({usn:"NNM24CS103"});
    console.log(row);
    const rows = await students.find().toArray();
    console.log(rows);

    await students.updateMany(
        {},
        {
            $inc: {
                sem: 1
            }
        }
    )
    await students.deleteOne({usn:"NNM24IS201"});

    await students.deleteMany({usn:"NNM24CS103"});


    await client.close();
}


main();