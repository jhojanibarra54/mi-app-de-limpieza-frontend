import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VerificationFailedPage } from './verification-failed.page';

describe('VerificationFailedPage', () => {
  let component: VerificationFailedPage;
  let fixture: ComponentFixture<VerificationFailedPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(VerificationFailedPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
