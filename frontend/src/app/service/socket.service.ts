import {Injectable} from '@angular/core';
import {Socket} from 'ngx-socket-io';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {

  constructor(private socket: Socket) {
  }

  newconnection() {
    return this.socket;
  }

  connectionIsAlive(UserSocket) {
    UserSocket.emit('pong', function (data) {
      // console.log(data);
    });
  }

  yesConnectionIsAlive(UserSocket, cb) {
    UserSocket.on('ping', function (data) {
      cb(data);
    });
  }

  login(name, password, cb) {
    console.log('');
    this.socket.emit('new user', [name, password], function (data, msg) {
      if (data) {
        cb(null, [data]);
      } else {
        cb(msg, null);
      }
    });
  }

  popupUser(mysocket, cb) {
    mysocket.on('usernames', function (data, name) {
      cb([data, name]);
    });
  }

  getOnlineUserList(name, cb) {
    this.socket.emit('getOnlineUser', name, function (data) {
      cb(data);
    });
  }

  logoutUser(data, callback) {
    console.log('logout');
    this.socket.emit('logout', data, function (result) {
      callback(result);
    });
  }

  findMessage(name, cb) {
    const that = this;
    this.socket.emit('find message', name);
    this.notification(function (notificationData) {
      that.loadMessage(function (msgData) {
        cb([notificationData, msgData]);
      });
    });
  }

  loadMessage(cb) {
    this.socket.on('loadOldMessages', function (data) {
      cb(data);
    });
  }

  findLastMessage(name, cb) {
    const that = this;
    this.socket.emit('findLastMessage', name, function (err, messages) {
      if (err) {
        cb(err, null);
      } else {
        cb(null, messages);
      }
    });
  }

  newmessage(cb) {
    this.socket.on('new message', function (msgdata) {
      cb(msgdata);
    });
  }

  notification(cb) {
    console.log('notification callback');
    this.socket.on('notification', function (users, message, activeUser) {
      cb([users, message, activeUser]);
    });
  }

  sendMessage(name, currentDate, cb) {
    this.socket.emit('sendMessage', [name, currentDate], function (data) {
      console.log('err,data', data);
      if (data) {
        cb(data);
      }
    });
  }


}
