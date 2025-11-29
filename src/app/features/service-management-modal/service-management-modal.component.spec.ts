import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ServiceManagementModalComponent } from './service-management-modal.component';

describe('ServiceManagementModalComponent', () => {
  let component: ServiceManagementModalComponent;
  let fixture: ComponentFixture<ServiceManagementModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ServiceManagementModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceManagementModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
