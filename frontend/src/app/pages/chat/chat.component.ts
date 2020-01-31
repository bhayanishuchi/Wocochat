import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../service/notification.service';
import {UserService} from '../../service/user.service';
import {Router} from '@angular/router';
import {SocketService} from '../../service/socket.service';
import {Socket} from 'ngx-socket-io';

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
  selectUser;
  msgval;
  chatList;
  username;
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
    const soc = this.socketService.newconnection();
    this.userId = localStorage.getItem('user_id');
    const userName = localStorage.getItem('userName');
    /*this.socketService.popupUser(soc, (data) => {
      console.log('data', data);
      this.username = data[1];
      (data[0]).forEach((x) => {
        (this.users).forEach((y, i) => {
          if (x.toString() === (y.userName).toString()) {
            this.users[i].status = true;
          }
        });
      });
    });
    this.socketService.getOnlineUserList(userName, (data) => {
      console.log('getOnlineUserList data', data);
      this.users = [];
      data.forEach((x) => {
        this.users.push({userName: x.userName, status: false});
      });
    });

    this.socketService.loadMessage((loadMessages) => {
      console.log('loadMessages data', loadMessages);
    });

    this.socketService.notification((notificationMessage) => {
      console.log('notificationMessage data', notificationMessage);
    });*/
    if (!accessToken) {
      this.router.navigate(['/login']);
    }
    this.getAllUserApi();
  }

  getAllUserApi() {
    this.userService.getAllUser(this.userId)
      .subscribe((data) => {
        this.totalFriend = data.length;
        (data).forEach((x) => {
          this.users.push(x.userName);
        });
      }, (err) => {
        console.log('err', err);
      });
  }

  selectedUserApi(user) {
    console.log('selected user', user);
    this.selectUser = user;
    this.showChat = true;
    const that = this;
    this.userService.findMessage(user)
      .subscribe((res) => {
        console.log('findMessage data', res);
        // (data[1]).sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime());
        that.msg = [];
        // that.msg = data[1];
      }, (err) => {
      });
  }

  sendmessage() {
    const that = this;
    const str = '/w ' + this.selectUser + ' ' + this.msgval;
    console.log('send message', str);
    const currentDate = new Date().toLocaleString();
    if ((this.msgval).length > 0) {
      this.socketService.sendMessage(str, currentDate, function (err) {
        if (err) {
          that.notify.showError(err);
        }
      });
      const data = {
        msg: this.msgval,
        nick: this.username,
        flag: false,
        date: that.formatDate(currentDate),
        time: that.formatTime(currentDate),
      };
      this.msg.push(data);
      data['nick'] = this.selectUser;
      (this.chatList).filter((x) => {
        if (x.nick === this.selectUser) {
          that.chatList[(that.chatList).indexOf(x)].msg = data.msg;
          that.chatList[(that.chatList).indexOf(x)].date = data.date;
          that.chatList[(that.chatList).indexOf(x)].time = data.time;
          that.array_move(this.chatList, (this.chatList).indexOf(x), 0);
        }
      });
      console.log('chatlist', this.chatList);
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
    date = new Date(date);
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
