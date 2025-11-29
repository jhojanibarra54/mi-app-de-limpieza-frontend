import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RequestConfirmationModalComponent } from './request-confirmation-modal.component';

describe('RequestConfirmationModalComponent', () => {
  let component: RequestConfirmationModalComponent;
  let fixture: ComponentFixture<RequestConfirmationModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RequestConfirmationModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RequestConfirmationModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
