const MongoClient = require('mongodb').MongoClient;
const mongoose = require('mongoose');
const orgModel = require('../../../models/orgModel');
const userModel = require('../../../models/userModel');
const update = require('immutability-helper');
require('dotenv').config()

const uri = process.env.MONGO_URI_PRO_ACCOUNTS_DEV;


module.exports = {
    postNewUser: function (payload) {
        console.log(payload.data.orgId);
        console.log("creating user...");
        const userObj = {
            id: payload.data.id,
            username: null,
            isAdmin: payload.data.role === "Admin" ? true : false,
            email: payload.data.email, 
            name: payload.data.name
        };

        let success = {};
        const mongoResponse = new Promise((resolve, reject) => {
            //mongoose.connect(uri, {useNewUrlParser: true});
            orgModel.update({orgId: payload.data.orgId}, { $push: {users: userObj} }, function(err, res){
                if(err) {
                    success = {
                        success: false, 
                        data: err
                    }
                    resolve(success);
                } else {
                    success = {
                        success: true, 
                        message: "User added to top-level user list"
                    }
                    resolve(success);
                }
            })
        })

        return mongoResponse.then((success) => {
            //mongoose.disconnect();
            console.log(success);
            return success;
        })
    }, 
    postToTeam: function(payload) {
        console.log(payload);
        console.log("creating user within team...");
        let updatedTeams = [];
        const teamUserObj = {
            id: payload.data.id,
            username: null,
            role: payload.data.role,
            email: payload.data.email, 
            name: payload.data.name, 
            invitePending: true
        };
        let success = {};
        const mongoResponse = new Promise(async (resolve, reject) => {
            //mongoose.connect(uri, {useNewUrlParser: true});
            var user = new userModel({
                name: payload.data.name, 
                id: payload.data.id, 
                email: payload.data.email, 
                username: null,
                role: payload.data.role,
                invitePending: true, 
                teamId: payload.data.selectedTeam
            })
            await orgModel.find({ orgId: payload.data.orgId }, async function(err, docs) {
                if(err) {
                    console.log(err);
                } else {
                    if(docs.length > 0) {
                        const thisData = docs[0];
                        const theseTeams = thisData.teams;
                        const index = await theseTeams.map(x => {return x.id}).indexOf(payload.data.selectedTeam);
                        if(index > -1) {
                            const thisTeam = theseTeams[index];
                            console.log(thisTeam);
                            const teamUsers = thisTeam.users;
                            teamUsers.push(user);
                            thisTeam["users"] = teamUsers;
                            console.log(thisTeam);
                            updatedTeams = await update(theseTeams, {$splice: [[index, 1, thisTeam]]});
                            console.log(updatedTeams)
                            if(updatedTeams.length > 0 ) {
                                orgModel.update({orgId: payload.data.orgId}, { $set: {teams: updatedTeams} }, function(err, res){
                                    if(err) {
                                        success = {
                                            success: false, 
                                            data: err
                                        }
                                        resolve(success);
                                    } else {
                                        success = {
                                            success: true, 
                                            message: "User added to top-level user list"
                                        }
                                        resolve(success);
                                    }
                                })
                            } else {
                                success = {
                                    success: false, 
                                    message: "Teams array empty"
                                }
                                resolve(success);
                            }
                        } else {
                            success = {
                                success: false, 
                                message: "Error with team index"
                            }
                            resolve(success)
                        }
                        
                    } else {
                        console.log("No data found")
                        success = {
                            success: false, 
                            message: "No data found"
                        }
                    }
                }
            })
        })

        return mongoResponse.then((success) => {
            //mongoose.disconnect();
            console.log(success);
            return success;
        })
    }
}