import {Component, OnInit} from '@angular/core';
import {UserService} from '../../service/user.service';
import {NotificationService} from '../../service/notification.service';
import {Router} from '@angular/router';
import {Socket} from 'ngx-socket-io';
import {SocketService} from '../../service/socket.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  users: any = {};

  constructor(private userService: UserService,
              private notify: NotificationService,
              private socket: Socket,
              private socketService: SocketService,
              private router: Router) {
  }

  ngOnInit() {
    const socket = this.socketService.newconnection();
    this.socketService.connectionIsAlive(socket);
    this.socketService.yesConnectionIsAlive(socket, function (data) {
      // console.log('yes Connection Is Alive data', data)
    });
  }

  onLogin() {
    const that = this;
    this.userService.userLogin(this.users)
      .subscribe((res) => {
        console.log('res', res);
        if (res) {
          // this.socketService.login(res.user.userName, this.users.password, function (err, data) {
          //   console.log('err, data', err, data);
          //   if (err) {
          //     that.notify.showError(err);
          //   } else {
          localStorage.setItem('token', res.tokens.authToken);
          localStorage.setItem('userName', res.user.userName);
          localStorage.setItem('user_id', res.user.user_id);
          that.notify.showSuccess('Login Successfully..!');
          that.router.navigate(['/createcontact']);
          // }

          // });
        }
      }, error => {
        this.notify.showError(error.message);
        console.log('error', error);
      });
  }

  onSignUp() {
    this.router.navigate(['/signup']);
  }
}
