import { Routes } from '@angular/router';
import { SplashComponent } from './components/splash/splash.component';
import { PinEntryComponent } from './components/pin-entry/pin-entry.component';
import { HomeComponent } from './components/home/home.component';
import { SendMoneyComponent } from './components/send-money/send-money.component';
import { AdminComponent } from './components/admin/admin.component';
import { PhoneScreenComponent } from './components/phone-screen/phone-screen.component';

export const routes: Routes = [
  { path: '', component: SplashComponent },
  { path: 'splash', component: SplashComponent },
  { path: 'pin', component: PinEntryComponent },
  { path: 'home', component: HomeComponent },
  { path: 'send-money', component: SendMoneyComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'phone-screen', component: PhoneScreenComponent },
  { path: '**', redirectTo: '' }
];
