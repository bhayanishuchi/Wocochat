import {Component, OnInit} from '@angular/core';
import {NotificationService} from '../../service/notification.service';
import {UserService} from '../../service/user.service';
import {Router} from '@angular/router';


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
              private router: Router) {
  }

  ngOnInit() {
    const accessToken = localStorage.getItem('token');
    this.userId = localStorage.getItem('user_id');
    // console.log('accessToken', accessToken);
    if (!accessToken) {
      this.router.navigate(['/login']);
    }
    this.getContactBook();
  }

  getContactBook() {
    this.userService.getuserContactBook(this.userId)
      .subscribe((data) => {
        this.totalFriend = data.numbers.length;
      }, (err) => {
        console.log('err', err);
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
