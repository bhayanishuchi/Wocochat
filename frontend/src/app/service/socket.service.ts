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

  loadMessage(cb) {
    this.socket.on('loadOldMessages', function (data) {
      cb(data);
    });
  }

  notification(cb) {
    console.log('notification callback');
    this.socket.on('notification', function (message, from, msg) {
      cb([message, from, msg]);
    });
  }
}
