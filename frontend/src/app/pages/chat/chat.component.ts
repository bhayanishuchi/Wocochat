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
    const soc = this.socketService.newconnection();
    this.userId = localStorage.getItem('user_id');
    this.userName = localStorage.getItem('userName');
    /*this.socketService.popupUser(soc, (data) => {
      console.log('data', data);
      this.userName = data[1];
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
    this.userService.findMessage(this.userName, user)
      .subscribe((res) => {
        console.log('findMessage data', res);
        (res).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        (res).forEach((x)=>{
          if(x.nick.toString() === this.userName.toString()){
            x.flag = false;
          }else{
            x.flag = true;
          }
        })
        that.msg = [];
        that.msg = res;
        console.log('msg', that.msg);
      }, (err) => {
      });
  }

  sendmessage() {
    const that = this;
    const str = '/w ' + this.selectUser + ' ' + this.msgval;
    console.log('send message', str);
    const currentDate = new Date().toLocaleString();
    if ((this.msgval).length > 0) {
      let body = {
        msg:this.msgval,
        to:this.selectUser,
        userName:this.userName,
        currentDate:currentDate,
        date: that.formatDate(currentDate),
        time: that.formatTime(currentDate),
      }
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
          console.log('this.msg', this.msg);
          data['nick'] = this.selectUser;
          console.log('this.chatList', this.chatList);
          (this.chatList).filter((x) => {
            if (x.nick === this.selectUser) {
              that.chatList[(that.chatList).indexOf(x)].msg = data.msg;
              that.chatList[(that.chatList).indexOf(x)].date = data.date;
              that.chatList[(that.chatList).indexOf(x)].time = data.time;
              that.array_move(this.chatList, (this.chatList).indexOf(x), 0);
            }
          });
          console.log('chatlist', this.chatList);
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
