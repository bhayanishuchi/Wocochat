import {Routes} from '@angular/router';

import {DashboardComponent} from '../../pages/dashboard/dashboard.component';
import {ChatComponent} from '../../pages/chat/chat.component';

export const AdminLayoutRoutes: Routes = [
  {path: '', component: DashboardComponent},
  {path: 'createcontact', component: DashboardComponent},
  {path: 'chat', component: ChatComponent}
];
