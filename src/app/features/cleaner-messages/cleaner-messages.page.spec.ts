import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CleanerMessagesPage } from './cleaner-messages.page';

describe('CleanerMessagesPage', () => {
  let component: CleanerMessagesPage;
  let fixture: ComponentFixture<CleanerMessagesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CleanerMessagesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
