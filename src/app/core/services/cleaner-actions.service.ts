import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CleanerActionsService {
  private openServicesModalSource = new Subject<void>();

  openServicesModal$ = this.openServicesModalSource.asObservable();

  requestOpenServicesModal() {
    this.openServicesModalSource.next();
  }
}