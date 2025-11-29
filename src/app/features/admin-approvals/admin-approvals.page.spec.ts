import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminApprovalsPage } from './admin-approvals.page';

describe('AdminApprovalsPage', () => {
  let component: AdminApprovalsPage;
  let fixture: ComponentFixture<AdminApprovalsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminApprovalsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
