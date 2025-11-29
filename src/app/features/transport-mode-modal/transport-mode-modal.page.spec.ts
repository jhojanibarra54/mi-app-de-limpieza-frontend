import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransportModeModalPage } from './transport-mode-modal.page';

describe('TransportModeModalPage', () => {
  let component: TransportModeModalPage;
  let fixture: ComponentFixture<TransportModeModalPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TransportModeModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
