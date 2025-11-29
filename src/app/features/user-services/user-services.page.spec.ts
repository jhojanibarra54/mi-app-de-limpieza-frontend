import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserServicesPage } from './user-services.page';

describe('UserServicesPage', () => {
  let component: UserServicesPage;
  let fixture: ComponentFixture<UserServicesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(UserServicesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
