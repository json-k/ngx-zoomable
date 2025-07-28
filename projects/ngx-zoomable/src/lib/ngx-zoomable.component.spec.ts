import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxZoomableComponent } from './ngx-zoomable.component';

describe('NgxZoomableComponent', () => {
  let component: NgxZoomableComponent;
  let fixture: ComponentFixture<NgxZoomableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxZoomableComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NgxZoomableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
