import { MongoClient } from "mongodb";

console.log("Opening connection to MongoDB");
const connectionString = process.env.ATLAS_URI || "";

const client = new MongoClient(connectionString);

let conn;
try {
    conn = await client.connect();
} catch(e) {
    console.log("Opening connection to MongoDB FAILED");
    console.error(e);
}
console.log("Connection to MongoDB is open");


let db = conn.db(process.env.MONGODB);

export default db;