import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SearchHomeComponent } from './pages/search-home/search-home.component';

const routes: Routes = [
  { path: '', component: SearchHomeComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    initialNavigation: 'enabled'
})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
