import express from 'express';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import cors from "cors";
import { userRouter } from './routers/users.js';
import { assetsRouter } from './routers/assets.js';
import { sellAssetsRouter } from './routers/sellAssets.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT;
const MONGO_URL = process.env.MONGO_URL;

app.use(express.json());
app.use(cors());

async function createConnection(){
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("Database connection established");
    return client;
}

export const client = await createConnection();

app.get('/', function(request, response){
    response.send("Welcome Home!");
});

app.use('/users', userRouter);
app.use('/assets', assetsRouter);
app.use('/sell-assets', sellAssetsRouter);

app.listen(PORT, () => console.log("Server listening to port "+PORT));
