const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, { cors: { origin: '*' } });

// app.get('/', (req, res) => {
//   res.sendFile(__dirname + '/index.html');
// });

let listUser = [];
let allStatus = {
  isSpin: false,
  isCheckAll: false,
  listItem: []
}
let rand;

io.on('connection', (socket) => {
  socket.on('sendUserAccess', (socketId, userInfo, allStatusWheel) => {
    //allStatus.listItem = allStatusWheel.listItem;
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

    io.local.emit("receiveListUser", listUser, allStatus.isSpin); //hàm local.emit sẽ chuyển thông tin đến tất cà các client
    allStatusWheel.listItem = listUser;
  })

  socket.on('clickCheckAllMember', function (isChecked, allStatusWheel) {
    allStatus.isCheckAll = isChecked;
    listUser = allStatusWheel.listItem;
    socket.broadcast.emit('checkAllMember', isChecked); //hàm broadcast.emit chuyển thông tin từ 1 socketclient đang thao tác trên màn hình đến những socketclient khác
  });


  socket.on('clickCheckOneMember', function (idElement, isChecked, allStatusWheel) {
    allStatus = allStatusWheel;
    // if (isChecked === false) {
    //   allStatus.isCheckAll = isChecked;
    // }
    // console.log(allStatus);
    // console.log(idElement);
    listUser = allStatusWheel.listItem;
    socket.broadcast.emit('checkOneMember', idElement, isChecked);
  });

  socket.on('spinWheel', function (random) {
    rand = random;
    allStatus.isSpin = true;
    socket.broadcast.emit('spinWheelSocket', random);
  })

  socket.on('resetWheel', () => {
    allStatus.isSpin = false;
    socket.broadcast.emit('resetWheelSpin');
  })

  socket.on('completeSpin', () => {
    allStatus.isSpin = false;
  })

  socket.on('disconnect', () => {
    console.log(socket.id);
    var posInd = listUser.findIndex(i => i.socketId === socket.id);
    console.log(posInd);
    if (posInd > -1) {
      listUser.splice(posInd, 1);
    }
    var posInd = listUser.findIndex(i => i.socketId === undefined);
    if (posInd > -1) {
      listUser.splice(posInd, 1);
    }
    if (allStatus.isSpin === false) {
      allStatus.isSpin = false;
      socket.broadcast.emit('resetWheelSpin');
    }
    io.local.emit("receiveListUserDisconnect", listUser, allStatus.isSpin);
  });
});

server.listen(4000, () => {
  console.log('listening on *:4000');
});
