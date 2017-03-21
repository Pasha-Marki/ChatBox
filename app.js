var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');

app.get('/', function(req, res){
  //var use = $_GET["user"];
  //if(use!=""){

  //}
  res.sendFile(path.join(__dirname,'/index.html'));
});
users = [];

io.on('connection', function(socket){
  console.log('A user connected');
  socket.on('setUsername', function(data){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onload = function(){
      socket.emit('Login', 'Hash is: ' + this.responseText)
    };
    xmlhttp.open("POST", "login.php", true);
    xmlhttp.send("info = " + data);







    /*console.log(data);
    if(users.indexOf(data) > -1){
      socket.emit('userExists', data + ' username is taken! Try some other username.');
    }
    else{
      users.push(data);
      socket.emit('userSet', {username: data});
    }*/
  });
  socket.on('msg', function(data){
      //Send message to everyone
      io.sockets.emit('newmsg', data);
  })
});
http.listen(8888, function(){
  console.log('listening on localhost:8888');
});
