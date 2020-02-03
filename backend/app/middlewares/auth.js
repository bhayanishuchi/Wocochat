const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AuthModel = mongoose.model('tokenCollection');

const logger = require('./../libs/loggerLib');
const response = require('./../libs/responseLib');
const token = require('./../libs/tokenLib');
const check = require('./../libs/checkLib');

const User = mongoose.model('User');
const ChatMessages = mongoose.model('ChatMessages');


let allUser = [];
let loginUser = [];

let isAuthorize = (req, res, next) => {
  console.log("isAuthorize");
  if (req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')) {
    AuthModel.findOne({authToken: req.params.authToken || req.query.authToken || req.body.authToken || req.header('authToken')}).exec((err, authDetails) => {
      if (err) {
        console.log(err);
        logger.error(err.message, 'AuthorizationMiddleware', 10);
        let apiResponse = response.generate(true, 'Failed To Authorized', 500, null);
        res.status(401).send(apiResponse);
      } else if (check.isEmpty(authDetails)) {
        logger.error('User logged out already or user not registered', 'AuthorizationMiddleware', 10);
        let apiResponse = response.generate(true, 'User logged out already or user not registered', 500, null);
        res.status(401).send(apiResponse);
      } else {
        token.verifyClaims(authDetails.authToken, (err, decoded) => {
          if (err) {
            logger.error(err.message, 'Authorization Middleware', 10);
            let apiResponse = response.generate(true, 'Failed To Authorized', 500, null);
            res.status(401).send(apiResponse);
          } else {
            // console.log('decoded',decoded)
            // res.send(decoded.data)
            req.user = decoded.data;
            next();
          }
        });
      }
    });
  } else {
    let apiResponse = response.generate(true, 'Auth Token is missing', 404, null);
    res.status(401).send(apiResponse);
  }

}; // end of isAuthorize

let joinRoom = (req, res, next) => {
  console.log("joinRoom");
  if (req.app.socket) {
    let socket = req.app.socket;
    console.log('userDetail.customer_id', socket.id, req.user.userName);
    socket.join(req.user.userName);
    next();
  } else {
    next();
  }

}; // end of isAuthorize

let newUserLogin = (socket, data, callback) => {
  console.log("newUserLogin", socket.id);
  let allDbUser = User.find();
  allDbUser.sort('-created').exec(function (err, resAllDbUser) {
    if (err) throw err;
    let keys = [];

    resAllDbUser.filter((x) => {
      if (allUser.length !== resAllDbUser.length)
        allUser.push({userName: x.userName});
    });

    allUser.filter((y) => {
      if (keys.indexOf(y.userName) === -1)
        keys.push(y.userName);
    });

    console.log('allUser', allUser);
    console.log('keys', keys);

    let check = false;

    loginUser.filter((x) => {
      if (Object.keys(x)[0] === data[0]) {
        check = true;
      }
    });

    if (keys.indexOf(data[0]) !== -1 && check !== true) {
      callback(true, '');
      socket.nickname = data[0];
      if (loginUser.length > 0) {
        let newKey = [];
        loginUser.filter((y) => {
          let key = Object.keys(y);
          newKey.push(key[0]);
          (y[key[0]][0].users).push(socket.nickname);
        });
        let abc = {};
        abc[socket.nickname] = [{socket: socket, users: newKey}];
        loginUser.push(abc);
      } else {
        let abc = {};
        abc[socket.nickname] = [{socket: socket, users: []}];
        loginUser.push(abc);
      }
      updateNicknames();
    } else {
      if (check === true) {
        callback(false, 'You are already Login into system');
      } else {
        callback(false, 'You are not Register User to use this app');
      }
    }
  });
};

let listofalluser = (name, callback) => {
  let query1 = User.find({userName: {$ne: name}});
  query1.sort('-created').exec(function (err, userData) {
    if (err) {
      callback(err)
    } else {
      callback(userData)
    }
  })
};

let findUserMessage = (socket, name) => {
  if(socket.nickname) {
    let newArr = [];
    loginUser.filter((x) => {
      newArr.push(Object.keys(x)[0]);
    })
    let keys = [];
    if (loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].message) {
      let len = (loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].message).length
      for (let i = 0; i < len; i++) {
        keys.push(Object.keys(loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].message[i])[0])
      }
      if (keys.indexOf(name) !== -1) {
        let abc = {};
        abc[name] = {
          read: 1,
          counter: 0,
        };
        loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].message[keys.indexOf(name)] = abc
      }
    }
    loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].activeUser = [];
    let abc = {};
    abc[name] = true;
    abc['id'] = loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].socket.id;
    loginUser[newArr.indexOf(socket.nickname)][socket.nickname][0].activeUser[0] = abc;

    let query = ChatMessages.find({$or: [{$and: [{nick: socket.nickname}, {to: name}]}, {$and: [{nick: name}, {to: socket.nickname}]}]});
    query.sort('-created').exec(function (err, docs) {
      if (err) throw err;
      docs.filter((x) => {
        if ((socket.nickname) === x.to) {
          x['flag'] = true
        } else {
          x['flag'] = false;
        }
        x['date'] = formatDate(x.created);
        x['time'] = formatTime(x.created);
      })
      notification();
      socket.emit('loadOldMessages', docs);
    })
  }
};

let disconnectUser = (socket, data, callback) => {
  console.log('disconnectUser', socket.nickname, data)
  if (!socket.nickname) callback(false);
  let newdata;
  loginUser.filter((x) => {
    let abc = Object.keys(x);
    // callback('success')
    if (socket.nickname === abc[0]) {
      delete loginUser[loginUser.indexOf(x)];
    }
    else {
      data = x[abc[0]];
      (data[0].users).filter((x) => {
        var index = data[0].users.indexOf(socket.nickname);
        if (index > -1) {
          (data[0].users).splice(index, 1);
        }
      });
      loginUser[loginUser.indexOf(x)][abc[0]][0].socket.emit('usernames', data[0].users, data[0].socket.nickname);
    }
  });
  callback('success');
  // updateNicknames();
};

let sendingMessage = (socket, newData, callback) => {
  console.log('disconnectUser', socket.nickname, data)
  let currentDate = newData[1];
  let data = newData[0];
  console.log('curdate', currentDate);
  console.log('date', new Date());
  console.log('date1', new Date());
  let msg = data.trim();
  if (msg.substr(0, 3) === "/w ") {
    msg = msg.substr(3);
    var ind = msg.indexOf(' ');
    if (ind !== -1) {
      var name = msg.substring(0, ind).trim();
      msg = msg.substring(ind + 1);
      let newArr = [];
      Lusers.filter((x) => {
        newArr.push(Object.keys(x)[0]);
      })
      if (newArr.indexOf(name) !== -1) {
        let flag = (socket.nickname === name) ? true : false;
        let newMsg = new Chat({
          msg: msg,
          nick: socket.nickname,
          to: name,
          created: currentDate,
          offline: false,
          counter: 0
        });
        newMsg.save(function (err) {
          if (err) throw err;

          // Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].socket.emit('new message', {
          //   msg: msg,
          //   nick: socket.nickname,
          //   flag: flag,
          //   date: formatDate(currentDate),
          //   time: formatTime(currentDate),
          // })
          console.log('see', Lusers[newArr.indexOf(name)][name][0].activeUser);
          console.log('my', Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].socket.id);
          console.log('samane wala', Lusers[newArr.indexOf(name)][name][0].socket.id);

          if (Lusers[newArr.indexOf(name)][name][0].activeUser === undefined || Object.keys(Lusers[newArr.indexOf(name)][name][0].activeUser[0])[0] !== socket.nickname) {
            if (Lusers[newArr.indexOf(name)][name][0].message === undefined) {
              Lusers[newArr.indexOf(name)][name][0].message = [];
            }
            let keys = [];
            let len = (Lusers[newArr.indexOf(name)][name][0].message).length
            for (let i = 0; i < len; i++) {
              keys.push(Object.keys(Lusers[newArr.indexOf(name)][name][0].message[i])[0])
            }
            let arr = Lusers[newArr.indexOf(name)][name][0].message;
            if (keys.indexOf(socket.nickname) !== -1) {
              let abc = {};
              abc[socket.nickname] = {
                read: 0,
                counter: (arr[keys.indexOf(socket.nickname)][socket.nickname].counter) + 1,
              }
              Lusers[newArr.indexOf(name)][name][0].message[keys.indexOf(socket.nickname)] = abc;
            } else {
              let abc = {};
              abc[socket.nickname] = {
                read: 0,
                counter: counter,
              }
              Lusers[newArr.indexOf(name)][name][0].message.push(abc);
            }

            toName = Lusers[newArr.indexOf(name)][name][0].socket.id;
            fromName = socket.nickname;
            badge = true;
            notification();
          } else {
            Lusers[newArr.indexOf(name)][name][0].socket.emit('new message', {
              msg: msg,
              nick: socket.nickname,
              flag: !(flag),
              date: formatDate(currentDate),
              time: formatTime(currentDate),
            })
          }
        })
        console.log('whisper!')
      } else {
        let newcounter;
        console.log('see for offline msg', Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline);
        if (Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline) {
          console.log('1');
          if (Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name]) {
            console.log('2');
            if (Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name].read === 0) {
              console.log('3', Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name].newcounter);
              newcounter = (Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name].newcounter) + 1;
              Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name].newcounter = newcounter;
            } else {
              console.log('4');
              newcounter = 1;
              Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name].newcounter = 1;
            }
          } else {
            console.log('5');
            Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name] = {
              read: 0,
              newcounter: 1
            }
            newcounter = 1;
            console.log('chat', Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name]);
          }
        } else {
          console.log('6');
          Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline = {};
          Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline[name] = {
            read: 0,
            newcounter: 1
          }
          newcounter = 1;
          console.log('chat', Lusers[newArr.indexOf(socket.nickname)][socket.nickname][0].offline);
        }
        let newMsg = new Chat({
          msg: msg,
          nick: socket.nickname,
          to: name,
          created: currentDate,
          offline: true,
          counter: newcounter
        });
        newMsg.save(function (err) {
          if (err) throw err;
        })
      }
    } else {
      callback('Error! Please Enter a message for your whisper')
    }
  }
};

function notification() {
  let newdata;
  let key;
  loginUser.filter((z) => {
    let xyz = Object.keys(z);
    key = xyz[0];
    newdata = z[xyz[0]];
    loginUser[loginUser.indexOf(z)][xyz[0]][0].socket.emit('notification', newdata[0].users, newdata[0].message, newdata[0].activeUser);
  })
}

function updateNicknames() {
  let data;
  loginUser.filter((x) => {
    let abc = Object.keys(x);
    data = x[abc[0]];
    loginUser[loginUser.indexOf(x)][abc[0]][0].socket.emit('usernames', data[0].users, data[0].socket.nickname);
  });
}

function formatDate(date) {
  date = new Date(date);
  var monthNames = [
    "January", "February", "March",
    "April", "May", "June", "July",
    "August", "September", "October",
    "November", "December"
  ];

  var day = date.getDate();
  var monthIndex = date.getMonth();
  var year = date.getFullYear();

  return monthNames[monthIndex] + ' ' + day;
}

function formatTime(date) {
  date = new Date(date);
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return strTime;
}

module.exports = {
  isAuthorize: isAuthorize,
  joinRoom: joinRoom,
  newUserLogin: newUserLogin,
  listofalluser: listofalluser,
  findUserMessage: findUserMessage,
  disconnectUser: disconnectUser,
  sendingMessage: sendingMessage,
};
