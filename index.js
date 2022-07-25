const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: '*' } });

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let listUser = [];
let listChecked = [];
let allStatus = {
  isSpin: false,
  isCheckAll: false,
  listItem: []
}

io.on('connection', (socket) => {
  socket.on('sendUserAccess', (socketId, userInfo, allStatusWheel) => {
    allStatus.listItem = allStatusWheel.listItem;
    //console.log(allStatusWheel.isCheckAll);

    if (userInfo != null) {
      userInfo.socketId = socketId;
      listUser.push(userInfo);
    }
    var flags = [], tmpList = [];
    for (let i = 0; i < listUser.length; i++) {
      if (flags[listUser[i].username]) continue;
      flags[listUser[i].username] = true;

      if (allStatus.isCheckAll === true && allStatus.isSpin === false) {
        listUser[i].checked = true;
      }

      tmpList.push(listUser[i]);
    }
    listUser = tmpList;

    if (allStatus.isSpin === false) {
      console.log("abc:"+ allStatus.isSpin);
      socket.broadcast.emit('resetWheelSpin');
    }

    io.local.emit("receiveListUser", listUser); //HÀM emit sẽ chuyển thông tin đến tất cà các client

    allStatusWheel.listItem = listUser;
  })

  socket.on('clickCheckAllMember', function (isChecked, allStatusWheel) {
    allStatus.isCheckAll = isChecked;

    //hàm này chuyển thông tin từ 1 socketclient đang thao tác trên màn hình đến những socketclient khác
    listUser = allStatusWheel.listItem;
    socket.broadcast.emit('checkAllMember', isChecked);
  });


  socket.on('clickCheckOneMember', function (idElement, isChecked, allStatusWheel) {

    //hàm này chuyển thông tin từ 1 socketclient đang thao tác trên màn hình đến những socketclient khác
    if (isChecked === false) {
      allStatus.isCheckAll = isChecked;
    }
    listUser = allStatusWheel.listItem;
    socket.broadcast.emit('checkOneMember', idElement, isChecked);
  });


  socket.on('spinWheel', function (random) {
    allStatus.isSpin = true;
    socket.broadcast.emit('spinWheelSocket', random);
  })

  socket.on('resetWheel', () => {
    allStatus.isSpin = false;
    socket.broadcast.emit('resetWheelSpin');
  })


  socket.on('disconnect', () => {
    //  allStatus.isSpin = false;
    var pos_ind = listUser.findIndex(i => i.socketId === socket.id);
    if (pos_ind > -1) {
      listUser.splice(pos_ind, 1);
    }
    var pos_ind = listUser.findIndex(i => i.socketId === undefined);
    if (pos_ind > -1) {
      listUser.splice(pos_ind, 1);
    }
    if (allStatus.isSpin === false) {
      allStatus.isSpin = false;
      socket.broadcast.emit('resetWheelSpin');
    }

    console.log(listUser);
    console.log(allStatus.isSpin);

    io.local.emit("receiveListUserDisconnect", listUser, allStatus.isSpin);
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
