import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../service/notification.service';
import {UserService} from '../../service/user.service';
import {Router} from '@angular/router';
import {SocketService} from '../../service/socket.service';
import {Socket} from 'ngx-socket-io';
import {not} from 'rxjs/internal-compatibility';

@Component({
  selector: 'app-chat',
  moduleId: module.id,
  templateUrl: 'chat.component.html',
  styleUrls: ['./chat.component.scss']
})

export class ChatComponent implements OnInit {

  userId;
  totalFriend;
  users: any = [];
  selectUser:any = '';
  msgval;
  chatList: any = [];
  userName;
  showChat = false;
  msg: any = [];

  constructor(private notify: NotificationService,
              private userService: UserService,
              private socketService: SocketService,
              private socket: Socket,
              private router: Router) {
  }

  ngOnInit() {
    const accessToken = localStorage.getItem('token');
    this.userId = localStorage.getItem('user_id');
    this.userName = localStorage.getItem('userName');
    if (!accessToken) {
      this.router.navigate(['/login']);
    }

    const socket = this.socketService.newconnection();
    this.socketService.connectionIsAlive(socket);
    this.socketService.yesConnectionIsAlive(socket, function (data) {
      // console.log('yes Connection Is Alive data', data)
    });

    this.socketService.loadMessage((loadMessages) => {
      console.log('loadMessages data', loadMessages);
    });

    this.socketService.notification((notificationMessage) => {
      console.log('notificationMessage data', notificationMessage);
      this.notify.showInfo(notificationMessage[0] + ' from ' + notificationMessage[1]);
      if (notificationMessage[1].toString() !== this.selectUser.toString()) {
        (this.users).forEach((x) => {
          if (x.userName.toString() === notificationMessage[1].toString()) {
            x.message = notificationMessage[2].toString();
            x.Date = this.formatDate(new Date());
          }
        });
      }
    });

    this.getAllUserApi();
  }

  getAllUserApi() {
    this.userService.getAllUser(this.userId)
      .subscribe((data) => {
        this.totalFriend = data.length;
        (data).forEach((x) => {
          this.users.push({userName: x.userName, message: '', Date: ''});
          this.getLastMessage(x.userName);
        });
      }, (err) => {
        console.log('err', err);
      });
  }

  getLastMessage(userName) {
    this.userService.findMessage(this.userName, userName)
      .subscribe((res) => {
        if (res.length > 0) {
          (this.users).forEach((x) => {
            if (x.userName.toString() === userName.toString()) {
              x.message = res[res.length - 1].msg;
              x.Date = res[res.length - 1].date;
            }
          });
        }
      });
  }

  selectedUserApi(user) {
    console.log('selected user', user.userName);
    this.selectUser = user.userName;
    this.showChat = true;
    const that = this;
    this.userService.findMessage(this.userName, user.userName)
      .subscribe((res) => {
        console.log('findMessage data', res);
        (res).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        (res).forEach((x) => {
          if (x.nick.toString() === this.userName.toString()) {
            x.flag = false;
          } else {
            x.flag = true;
          }
        });
        that.msg = [];
        that.msg = res;
        (this.users).forEach((x) => {
          if (x.userName.toString() === this.selectUser.toString()) {
            console.log(res[res.length], res.length);
            x.message = res[res.length - 1].msg;
          }
        });
        console.log('msg', that.msg);
      }, (err) => {
      });
  }

  sendmessage() {
    const that = this;
    const str = '/w ' + this.selectUser + ' ' + this.msgval;
    console.log('send message', str);
    const currentDate = new Date();
    if ((this.msgval).length > 0) {
      const body = {
        msg: this.msgval,
        to: this.selectUser,
        userName: this.userName,
        currentDate: currentDate,
        date: that.formatDate(currentDate),
        time: that.formatTime(currentDate),
      };
      this.userService.sendMessage(body)
        .subscribe((res) => {
          console.log('resssssss', res);
          const data = {
            msg: res.msg,
            nick: this.userName,
            flag: false,
            date: that.formatDate(currentDate),
            time: that.formatTime(currentDate),
          };
          this.msg.push(data);
          (this.users).forEach((x) => {
            if (x.userName.toString() === this.selectUser.toString()) {
              console.log(res[res.length], res.length);
              x.message = data.msg;
            }
          });
        }, (err) => {
          that.notify.showError(err);
        });
    }
    this.msgval = '';
  }

  array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
      let k = new_index - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
  }

  formatDate(date) {
    // date = new Date(date);
    const monthNames = [
      'January', 'February', 'March',
      'April', 'May', 'June', 'July',
      'August', 'September', 'October',
      'November', 'December'
    ];

    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();

    return monthNames[monthIndex] + ' ' + day;
  }

  formatTime(date) {
    date = new Date(date);
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }

}
