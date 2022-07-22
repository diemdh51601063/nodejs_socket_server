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

var listUser = [];
var listChecked = [];
io.on('connection', (socket) => {
  console.log(socket.id);
  socket.on('getUserInfo', (socketId, userInfo, allStatusWheel) => {
    
    if (userInfo != null) {
      userInfo.socketId = socketId;
      listUser.push(userInfo);
    }
    var flags = [], tmpList = [];
    for (let i = 0; i < listUser.length; i++) {
      if (flags[listUser[i].name]) continue;
      flags[listUser[i].name] = true;
      tmpList.push(listUser[i]);
    }
    io.local.emit("receiveListUser", tmpList); //HÀM emit sẽ chuyển thông tin đến tất cà các client
    listUser = tmpList;
    allStatusWheel.listItem = tmpList;
    console.log(allStatusWheel);
  })

  socket.on('myClick', function (data, flag, name, allStatusWheel) {
    console.log(allStatusWheel);

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
    console.log('user disconnected');
    var pos_ind = listUser.findIndex(i => i.socketId === socket.id);
    if (pos_ind > -1) {
      listUser.splice(pos_ind, 1);
    }
    var pos_ind = listUser.findIndex(i => i.socketId === undefined);
    if (pos_ind > -1) {
      listUser.splice(pos_ind, 1);
    }

    io.local.emit("sendListUser", listUser);
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
