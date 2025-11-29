import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BecomeCleanerPage } from './become-cleaner.page';

describe('BecomeCleanerPage', () => {
  let component: BecomeCleanerPage;
  let fixture: ComponentFixture<BecomeCleanerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BecomeCleanerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
