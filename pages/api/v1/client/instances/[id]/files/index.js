import {get} from "axios"
import {decode} from "jsonwebtoken"
import { connectToDatabase } from "../../../../../../../util/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto"
export default async function handler(req, res) {
    const {query: {id, path}} = req;
    console.log(id);
    try {
        var user = decode(req.headers.authorization.split(" ")[1])
    } catch {
        return res.status(403).send("Unauthorized");
    }
    var {db} = await connectToDatabase();
    try {
        var instance = await db.collection("instances").findOne({
            _id: ObjectId(id),
            [`users.${user.id}`]: {$exists: true}
        })
    } catch (error) {
        console.log(error)
        console.log("error 1 oooh its shit fdksj;asldkjfakjsdl")
        return res.status(500).send("An error occured while fetching the instance data")
    }
    if (!instance) {
        return res.status(404).send("Instance does not exist")
    }
    try {
        var node = await db.collection("nodes").findOne({
            _id: ObjectId(instance.node)
        })
    } catch {
        return res.status(500).send("An error occured while fetching the node data");
    }
    if (!node) {
        return res.status(500).send("Node associated with server does not exist")
    }
    try {
        var decipher = crypto.createDecipheriv("aes-256-ctr", process.env.ENC_KEY, Buffer.from(node.access_token_iv, "hex"))
        var access_token = Buffer.concat([decipher.update(Buffer.from(node.access_token, "hex")), decipher.final()])
        console.log(`${node.address.hostname}:${node.address.port}/api/v1/instances/${id}/files?path=${path}`)
        var files = await get(`${node.address.hostname}:${node.address.port}/api/v1/instances/${id}/files?path=/${path}`, {
            Authorization: `Bearer ${access_token.toString()}`
        })
    } catch (error) {
        console.log(error)
        console.log("error 2")
        return res.status(500).send("An error occured while fetching the files")
    }
    try {
    var sorted = files.data.list.sort((a, b) => {
        if (a.type == "directory" && b.type == "file") {
            return -1
        } else if (a.type == "file" && b.type == "directory") {
            return 1
        } else {
            if (a.name > b.name) {
                return -1
            } else if (b.name > a.name){
                return 1
            } else {
                return 0
            }

        }
    })
} catch {
    return res.send(files.data)
}
    files.data.list = sorted;
    res.send(files.data)

}