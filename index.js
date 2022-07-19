const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: '*' } });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var user = {
  name: "abc",
  age: 15,
  info: "test"
}

var list_user = [];
io.on('connection', (socket) => {
  socket.on('getUserInfo', (socket_id, user_info) => {
    if (list_user !== null) {
      var pos = list_user.findIndex(i => i.text === user_info.text);
      var pos_socket = list_user.findIndex(i => i.socket_id === user_info.socket_id);
      if (pos_socket < 0 && pos < 0) {
        list_user.push(user_info);
      } 
    } else {
      list_user.push(user_info);
    }
    console.log(list_user);
    io.local.emit("sendListUser", list_user)
  })
  socket.on('chat', (msg) => {
    console.log('message: ' + msg);
    socket.send(msg);

    //emit là gửi thông tin đến toàn user có connect đến socket
    io.local.emit("send", user)
  });
  socket.on('myClick', function (data, flag, name) {

    //hàm này chuyển thông tin từ 1 socketclient đang thao tác trên màn hình đến những socketclient khác
    socket.broadcast.emit('checkAllItem', data, flag, name);
  });

  socket.on('spinWheel', function (random) {
    socket.broadcast.emit('spinWheelSocket', random);
  })

  socket.on('resetWheel', () => {
    socket.broadcast.emit('resetWheelSpin');
  })


  socket.on('disconnect', () => {
    console.log(socket.id);
    console.log('user disconnected');
    var pos_ind = list_user.findIndex(i => i.socket_id === socket.id);
    if(pos_ind > -1) {
      list_user.splice(pos_ind, 1);
    }
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});