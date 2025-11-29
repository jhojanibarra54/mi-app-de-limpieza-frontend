import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CleanerHomePage } from './cleaner-home.page';

describe('CleanerHomePage', () => {
  let component: CleanerHomePage;
  let fixture: ComponentFixture<CleanerHomePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(CleanerHomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
