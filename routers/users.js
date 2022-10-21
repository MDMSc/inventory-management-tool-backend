import express from 'express';
import { getHashedPassword, getUsers, postUser } from '../helper/Helper.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/add-user', async (request, response) => {
    const {username, email, phone, password} = request.body;
    const hashedPassword = await getHashedPassword(password);
    const users = await getUsers(username);
    if(users){
        response.status(400).send({message: "User already exists"});
        return;
    }
    if(!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g.test(password)){
        response.status(400).send({message: "Password must be 8 characters long and contain atleast one Uppercase, one Lowercase, one number and one special character" });
        return;
    }
    const result = await postUser({username, email, phone, type: null, password: hashedPassword});
    result.insertedId ? response.status(200).send({ message: "User added successfully" }) : response.status(400).send({ message: "Failed to add user" });
});

router.post("/login", async (request, response) => {
    const {username, password} = request.body;

    const userDB = await getUsers(username);
    //user doesn't exists
    if(!userDB) {
        response.status(400).send({message: "Invalid credentials"});
        return;
    }
    //password not matching
    const storedPw = userDB.password;
    const isPwMatch = await bcrypt.compare(password, storedPw);
    if(!isPwMatch){
        response.status(400).send({message: "Invalid credentials"});
        return;
    }
    //issue token
    let token = jwt.sign({id: userDB._id}, process.env.SECRET_KEY);
    const {email, phone, type} = userDB;
    const data = [
        {
            username, email, phone, type
        }
    ];
    response.status(200).send({ message: "Successful login", token, data });
});

// router.post('/forget-password', async function(request, response) {
//     // username, oldPassword, password, re-enter password
//     const {username, oldPassword, password, rePassword} = request.body;
    
//     const userDB = await getUsers(username);
//     //user doesn't exists
//     if(!userDB) {
//         response.status(400).send({message: "User not found"});
//         return;
//     }


// })


export const userRouter = router;
