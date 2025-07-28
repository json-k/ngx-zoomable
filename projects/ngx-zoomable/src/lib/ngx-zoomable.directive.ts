import { Directive, ElementRef, HostBinding, Input, Renderer2 } from '@angular/core';

export enum Size {
  AUTO = "AUTO", SCALE = "SCALE"
}

@Directive({
  selector: 'ngxZoomable,[ngxZoomable]',
  standalone: true,
  host: {
    '[style.position]': '"absolute"',
    '[style.transform-origin]': '"top left"',
  },
})
export class NgxZoomableDirective {
  // The native element to which this directive is attached
  private host: HTMLElement;

  constructor(private ref: ElementRef, private renderer: Renderer2) {
    this.host = ref.nativeElement;
  }

  @Input() x: number = 0;
  @Input() y: number = 0;
  @Input() w: number | Size = Size.AUTO;
  @Input() h: number | Size = Size.AUTO;
  @Input() pointer: boolean = false;
  @HostBinding('style.pointerEvents') get events() { return this.pointer ? 'auto' : 'none' };

  size(): DOMRect {
    return new DOMRect(
      this.x,
      this.y,
      (typeof this.w === 'number') ? this.w : this.host.offsetWidth,
      (typeof this.h === 'number') ? this.h : this.host.offsetHeight
    );
  }

  layout(matrix: DOMMatrix): void {
    let point: DOMPoint = matrix.transformPoint(new DOMPoint(this.x, this.y));
    // Position
    this.renderer.setStyle(this.host, 'left', `${point.x}px`);
    this.renderer.setStyle(this.host, 'top', `${point.y}px`);
    // Size
    let scales: number[] = [1, 1];
    // Width  -set value or scale
    if (typeof this.w === 'number' && this.w > 0) this.renderer.setStyle(this.host, 'width', `${matrix.a * this.w}px`);
    if (typeof this.w === 'string' && this.w === Size.SCALE) scales[0] = matrix.a;
    // Height -set value or scale
    if (typeof this.h === 'number' && this.h > 0) this.renderer.setStyle(this.host, 'height', `${matrix.d * this.h}px`);
    if (typeof this.h === 'string' && this.h === Size.SCALE) scales[1] = matrix.d;
    // Set the scale
    this.renderer.setStyle(this.host, 'transform', `scale(${scales.join(',')})`);
  }


}

