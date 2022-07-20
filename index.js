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
  console.log(socket.id);
  console.log("connected");
  socket.on('getUserInfo', (socket_id, user_info) => {
    if (user_info != null) {
      user_info.socket_id = socket_id;
      list_user.push(user_info);
    }
    var flags = [], tmp_list = [];
    for (let i = 0; i < list_user.length; i++) {
      if (flags[list_user[i].name]) continue;
      flags[list_user[i].name] = true;
      tmp_list.push(list_user[i]);
    }
    io.local.emit("sendListUser", tmp_list);
    list_user = tmp_list;
    console.log(tmp_list);
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
    if (pos_ind > -1) {
      list_user.splice(pos_ind, 1);
    }
    var pos_ind = list_user.findIndex(i => i.socket_id === undefined);
    if (pos_ind > -1) {
      list_user.splice(pos_ind, 1);
    }
    console.log(list_user);
    console.log(list_user.length);
   // io.local.emit("sendListUser", list_user);
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
