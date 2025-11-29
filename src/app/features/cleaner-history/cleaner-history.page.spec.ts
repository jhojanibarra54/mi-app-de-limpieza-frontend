import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CleanerHistoryPage } from './cleaner-history.page';

describe('CleanerHistoryPage', () => {
  let component: CleanerHistoryPage;
  let fixture: ComponentFixture<CleanerHistoryPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CleanerHistoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
