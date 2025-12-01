import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationSuccessPage } from './verification-success.page';

describe('VerificationSuccessPage', () => {
  let component: VerificationSuccessPage;
  let fixture: ComponentFixture<VerificationSuccessPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationSuccessPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
