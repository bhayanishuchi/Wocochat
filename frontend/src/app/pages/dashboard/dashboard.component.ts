import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../service/notification.service';
import {UserService} from '../../service/user.service';
import {Router} from '@angular/router';
import {SocketService} from "../../service/socket.service";
import {Socket} from "ngx-socket-io";


@Component({
  selector: 'dashboard-cmp',
  moduleId: module.id,
  templateUrl: 'dashboard.component.html'
})

export class DashboardComponent implements OnInit {

  number;
  totalFriend: any = 0;
  userId;

  constructor(private notify: NotificationService,
              private userService: UserService,
              private socketService: SocketService,
              private socket: Socket,
              private router: Router) {
  }

  ngOnInit() {
    const accessToken = localStorage.getItem('token');
    this.userId = localStorage.getItem('user_id');
    if (!accessToken) {
      this.router.navigate(['/login']);
    }
    this.socketService.connectionIsAlive(this.socket);
    this.socketService.yesConnectionIsAlive(this.socket, function (data) {
    });
    this.getContactBook();
  }

  getContactBook() {
    this.userService.getuserContactBook(this.userId)
      .subscribe((res) => {
        if (res.data) {
          this.totalFriend = res.data.length;
        }
      }, (err) => {
        console.log('err', err);
        if (err.status === 401) {
          localStorage.clear();
          this.router.navigate(['/login']);
        }
      });
  }

  onSave() {
    this.userService.setUserContact({userId: localStorage.getItem('user_id'), phoneNumber: this.number})
      .subscribe((res) => {
        console.log('res', res);
        this.notify.showSuccess('Contact Add Successfully');
        this.getContactBook();
      }, error => {
        this.notify.showError(error.error.message);
        console.log('error', error);
      });

  }
}
