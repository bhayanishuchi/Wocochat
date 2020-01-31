import { Injectable } from '@angular/core';
import {ToastrService} from "ngx-toastr";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private toastr: ToastrService) { }

  showSuccess(msg) {
    this.toastr.success(msg, '', { timeOut: 4000, enableHtml: true,
      toastClass: "alert alert-success alert-with-icon",
      closeButton: true, positionClass: 'toast-top-right'})
  }
  showError(msg) {
    this.toastr.error(msg, '', { timeOut: 4000, enableHtml: true,
      toastClass: "alert alert-error alert-with-icon",
      closeButton: true, positionClass: 'toast-top-right'})
  }
  showInfo(msg) {
    this.toastr.info(msg, '', { timeOut: 4000, enableHtml: true,
      toastClass: "alert alert-info alert-with-icon",
      closeButton: true, positionClass: 'toast-top-right'})
  }
}
