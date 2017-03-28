var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var req = require('request');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var xss = require('xss');
var options = {
  whiteList: {
    a: ['href', 'title', 'target'],
    b: true,
    i: true,
    u: true,
    s: true

  }
};
var myxss = new xss.FilterXSS(options);


const saltRounds = 10;
var pool = mysql.createPool({
  connectionLimit : 100,
  host    : '',
  port    : '',
  user    : '',
  password: '',
  database: '',
  debug   : false
});

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname,'/index.html'));
});



io.on('connection', function(socket){
  console.log('A user connected');
  socket.on('getUser', function(data){
    bcrypt.hash(data.password, saltRounds, function(err, hash){
      if(err){
        console.error(err);
      }
      pool.getConnection(function(err, connection){
        if(err) {
          console.error("error connecting to db" + err);
          return;
        }

        console.log('connected as id ' + connection.threadId);

        connection.query("select username, password from users where username = '??'", [data.username], function(error, results, fields){
          bcrypt.compare(data.password, results[0][1],function(err, res) {
            console.log(res);
            socket.emit('userSet', data);
          });

        });
      });

    });
  });

  socket.on('signUp', function(data){
    bcrypt.genSalt(saltRounds, function(err, salt){
      if(err){console.error('salt error', err);}
      bcrypt.hash(data.password, salt, function(err, hash){
        if(err){console.error('hash error', err);}
        pool.getConnection(function(err, connection){
          if(err){console.error('connection error', err);}
          connection.query("select username from users where username = '??'", [data.username], function(error, results, fields){
            if(error){console.error('initial query error', error);}
            console.log("got here");
            if(results[0]==null){
              connection.query("insert into users (username, password, salt) values ('??','??', '??')", [data.username, hash, salt], function(error, results, fields){
                if(error){console.error('query error', error);}
                else{
                socket.emit('userSet', {username: data.username});
                console.log("user signed in");
              }
              });
            }else socket.emit('repeatUser', {username: data.username});
          });
        });
      });
    });
  });

  socket.on('msg', function(data){
      //Send message to everyone
      io.sockets.emit('newmsg', {user: myxss.process(data.user), message: myxss.process(data.message)});
  });
});

function escapeScript(str){
  return str.replace(/<script>|script>/ig,"");
}
http.listen(8888, function(){
  console.log('listening on localhost:8888');
});
