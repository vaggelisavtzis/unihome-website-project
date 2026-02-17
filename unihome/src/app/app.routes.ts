import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/auth/login/login';
import { StudentRegisterComponent } from './pages/auth/student-register/student-register';
import { OwnerRegisterComponent } from './pages/auth/owner-register/owner-register';
import { PropertyListComponent } from './pages/properties/property-list/property-list';
import { PropertyDetailsComponent } from './pages/properties/property-details/property-details';
import { AddPropertyComponent } from './pages/properties/add-property/add-property';
import { FavoritesComponent } from './pages/favorites/favorites';
import { RoommateListComponent } from './pages/roommates/roommate-list/roommate-list';
import { RoommateDetailsComponent } from './pages/roommates/roommate-details/roommate-details';
import { Temporary } from './pages/temporary/temporary';
import { AddRoommateComponent } from './pages/roommates/add-roommate/add-roommate';
import { ProfilePage } from './pages/profile/profile';
import { authGuard } from './guards/auth.guard';
import { ownerGuard } from './guards/owner.guard';
import { studentGuard } from './guards/student.guard';
import { ContactComponent } from './pages/contact/contact';
import { AboutComponent } from './pages/about/about';
import { AddTemporaryComponent } from './pages/temporary/add-temporary/add-temporary';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'auth/login', component: LoginComponent },
    { path: 'auth/student-register', component: StudentRegisterComponent },
    { path: 'auth/owner-register', component: OwnerRegisterComponent },
    { path: 'properties', component: PropertyListComponent },
    { path: 'properties/add', component: AddPropertyComponent, canActivate: [ownerGuard] },
    { path: 'properties/:id/edit', component: AddPropertyComponent, canActivate: [ownerGuard] },
    { path: 'properties/:id', component: PropertyDetailsComponent },
    { path: 'favorites', component: FavoritesComponent, canActivate: [authGuard] },
    { path: 'profile', component: ProfilePage, canActivate: [authGuard] },
    { path: 'roommates', component: RoommateListComponent },
    { path: 'roommates/add', component: AddRoommateComponent, canActivate: [studentGuard] },
    { path: 'roommates/:id/edit', component: AddRoommateComponent, canActivate: [studentGuard] },
    { path: 'roommates/:id', component: RoommateDetailsComponent },
    { path: 'about', component: AboutComponent },
    { path: 'contact', component: ContactComponent },
    { path: 'temporary/add', component: AddTemporaryComponent, canActivate: [ownerGuard] },
    { path: 'temporary/:id/edit', component: AddTemporaryComponent, canActivate: [ownerGuard] },
    { path: 'temporary', component: Temporary },
];
