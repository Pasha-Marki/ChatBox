import express from 'express';
import HTTP from 'http';
var socketio = require('socket.io');
import "babel-polyfill";
import req from 'request';
import bcrypt from 'bcrypt';
import xss from 'xss';
import assert from 'assert';
import Mongo from 'mongodb';

const path = require('path');
const saltRounds = 10;
const url = 'mongodb://localhost:27017';
const dbName = 'chatbox';
const options = {
	whiteList: {
		a: ['href', 'title', 'target'],
		b: true,
		i: true,
		u: true,
		s: true
	}
};
const port = 8080;

const app = express();
const http = HTTP.createServer(app);
const io = socketio(http, {path: '/chatbox', serveClient: false});
const MongoClient = Mongo.MongoClient;
const myxss = new xss.FilterXSS(options);

const InsertUser = async function(username, passwordHash){
	let client;
	try {
		client = await MongoClient.connect(url);
		console.log("Connected to server");

		const db = client.db(dbName);
		const collection = db.collection('users');

		let is_user = await collection.findOne({
			name: username
		});

		if(is_user){
			client.close();
			return 'repeatUser';
		} else {
			assert.equal(null, is_user);

			let insert_user = await db.collection('users').insertOne({
				  name: username,
				  password: passwordHash
			  }, {
				  w: 'majority',
				  wtimeout: 1000,
				  forceServerObjectId: true
			  }
		  );

			assert.equal(1, insert_user.insertedCount);

			client.close();
			return 'userSet';
		}
	} catch (err) {
		console.log(err);
	}

	client.close();
};

const GetUserPassword = async function(username, passwordHash){
	let client;
	try {
		client = await MongoClient.connect(url);
		console.log("Connected to server");

		const db = client.db(dbName);

		let get_user = await db.collection('users').findOne({
			name: username
		});
		if(get_user){
		return get_user.password; 
		}
		else{
		throw 'incorrect user';
		}
	} catch(err) {
		throw err;
	};
}

app.get('/chatbox', (req, res) => {
	res.sendFile(path.join(__dirname, '/index.html'));
});

app.get('/chatbox/resources/socketjs', function(req, res) {
  console.log('send js file');
  res.sendFile(path.join(__dirname, '/node_modules/socket.io-client/dist/socket.io.js'));
});


io.use((socket, next) => {
  console.log('socket connection');
  return next();
});

io.on('connection', (socket) => {
	console.log('A user connected');

	socket.on('getUser', (data) => {
		GetUserPassword(data.username).then((password) => (
			bcrypt.compare(data.password, password)
		)).then((res) => {
			if(res){
				socket.emit('userSet', {username: data.username})
			}
			else {
				throw('incorrect password')};
		}).catch((err) => {
			if(err == 'incorrect user' || err == 'incorrect password'){
				console.log(err);
				socket.emit('badUser', {username: data.username});
			}
			else{
				console.log(err);
			}
		});
	});

	socket.on('signUp', function(data){
		bcrypt.hash(data.password, saltRounds).then((hash) => (
			InsertUser(data.username, hash)
		)).then((result) => {
			socket.emit(result, {username: data.username});
		});
	});

	socket.on('msg', (data) => {
		io.sockets.emit('newmsg', {user: myxss.process(data.user), message: myxss.process(data.message)});
	});

	socket.on('disconnect', function(){
		console.log('disconnected');
	});
});


http.listen(port, () => {
  console.log('listening on port ' + port);
});
