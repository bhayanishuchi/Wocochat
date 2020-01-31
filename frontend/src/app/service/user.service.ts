import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  api = environment.api;

  constructor(private http: HttpClient) {
  }

  userLogin(data) {
    return this.http.post<any>(this.api + '/user/login', data);
  }

  userSignUp(data) {
    return this.http.post<any>(this.api + '/user', data);
  }

  setUserContact(data) {
    return this.http.post<any>(this.api + '/user/createcontact', data);
  }

  getuserContactBook(userId) {
    return this.http.get<any>(this.api + '/user/contactbook/' + userId);
  }

  getAllUser(userId) {
    return this.http.get<any>(this.api + '/user/chat/users/' + userId);
  }

  findMessage(userName) {
    return this.http.get<any>(this.api + '/user/chat/messages/' + userName);
  }
}
