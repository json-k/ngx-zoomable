import { Component } from '@angular/core';
import { NgxZoomableComponent, NgxZoomableDirective, Size} from 'ngx-zoomable';
import { FancyButtonDirective } from './fancy-button.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    FancyButtonDirective,
    NgxZoomableComponent,
    NgxZoomableDirective,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent { 
  public Size = Size;
    
}
