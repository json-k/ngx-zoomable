import { Directive, ElementRef, HostBinding, HostListener, input, Input, Renderer2 } from '@angular/core';

@Directive({
  selector: '[fancyButton]',
  standalone: true,
  host: {
    '[style.font-weight]': '"900"',
    '[style.padding]': '"7px"',
    '[style.min-width]': '"200px"',
    '[style.border-radius]': '"20px"',
  },
})
export class FancyButtonDirective {
  private host: HTMLElement;
  private color: string = '#fff';

  @Input('fancyButton') set c(value: string) {
    this.color = value;
    this.renderer.setStyle(this.host, 'background-color', `color-mix(in srgb, ${this.color}, black 10%)`);
    this.renderer.setStyle(this.host, 'border', `1px solid oklch(from ${this.color} calc(l + 0.3) c h)`);
    this.renderer.setStyle(this.host, 'color', `oklch(from ${this.color} calc(l + 0.1) c h)`);
    this.renderer.setStyle(this.host, 'box-shadow', `inset 0 0 12px #ffffff33,inset 0 0 6px ${this.color}`);
    this.renderer.setStyle(this.host, 'text-shadow', `0 0 4px #ffffff722`);
  }

  @HostListener('pointerenter') onEnter(){
    this.renderer.setStyle(this.host, 'background-color', `color-mix(in srgb, ${this.color}, white 10%)`);
  }

  @HostListener('pointerdown') onDown(){
    this.renderer.setStyle(this.host, 'background-color', `rgb(from ${this.color} r g b / 100%)`);
    this.renderer.setStyle(this.host, 'color', '#fff');
  }

  @HostListener('pointerup') onUp(){
    this.renderer.setStyle(this.host, 'background-color', `rgb(from ${this.color} r g b / 70%)`);
    this.renderer.setStyle(this.host, 'color', `oklch(from ${this.color} calc(l + 0.1) c h)`);
  }

  @HostListener('pointerout') onExit(){
    this.renderer.setStyle(this.host, 'background-color', `color-mix(in srgb, ${this.color}, black 10%)`);
  }

  constructor(private ref: ElementRef, private renderer: Renderer2) {
    this.host = ref.nativeElement;
  }

}
