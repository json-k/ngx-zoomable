import { AfterContentInit, Component, ContentChildren, DestroyRef, ElementRef, HostBinding, inject, Input, NgZone, QueryList, Renderer2 } from '@angular/core';
import { NgxZoomableDirective } from './ngx-zoomable.directive';

@Component({
  selector: 'ngx-zoomable',
  standalone: true,
  imports: [],
  templateUrl: './ngx-zoomable.component.html',
  styleUrl: './ngx-zoomable.component.css'
})
export class NgxZoomableComponent implements AfterContentInit {
  /**
   * Misc inputs
   */
  @Input() padding: number = 10;
  @Input() clipped: boolean = true;
  @Input() zoomMax: number = 20;
  @Input() zoomMin: number = 0.2;

  /**
   * Event trackers
   */
  private dragStart?: DOMPoint = undefined;
  private zoomCache: Map<number,PointerEvent> = new Map<number,PointerEvent>();
  private zoomSize: number = 0;

  @HostBinding('style.overflow') get clip() { return this.clipped ? 'clip' : 'visible' };

  // The native element
  private host: HTMLElement;

  constructor(private zone: NgZone, ref: ElementRef,renderer: Renderer2) {
    this.host = ref.nativeElement;
    // Observing size changes.
    const observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this.zone.run(() => {
        this.invalidate();
        this.clamp();
        this.layout();
      });
    });
    observer.observe(this.host);
    // Unobserve on destroy.
    const deRef = inject(DestroyRef);
    deRef.onDestroy(() => observer.unobserve(this.host));
    // Create our event panel
    let events:HTMLElement = renderer.createElement('div');
    renderer.setStyle(events,'position','absolute');
    renderer.setStyle(events,'top','0');
    renderer.setStyle(events,'left','0');
    renderer.setStyle(events,'bottom','0');
    renderer.setStyle(events,'right','0');
    // Event listeners
    events.style.touchAction = 'none';
    events.onpointermove = (e: PointerEvent) => {
      if (this.zoomCache.has(e.pointerId)) this.zoomCache.set(e.pointerId, e);
      // If we have two (or more) pointers we assume we are zooming (pinching)
      if (this.zoomCache.size >= 2) {
        let [e1, e2] = [...this.zoomCache.values()].slice(0, 2);
        let dist = Math.hypot(e2.clientX - e1.clientX, e2.clientY - e1.clientY);
        if (this.zoomSize != 0) this.zoom(this.convert((e1.offsetX + e2.offsetX) / 2, (e1.offsetY + e2.offsetY) / 2), dist / this.zoomSize);
        this.zoomSize = dist;
      } else if (this.dragStart) {
        let p = this.convert(e.offsetX, e.offsetY);
        this.move(p.x - this.dragStart.x, p.y - this.dragStart.y);
      }
      // If we add a mouse over output here is where it should be.
    }
    events.onpointerdown = (e: PointerEvent) => {
      this.dragStart = this.convert(e.offsetX,e.offsetY);
      this.zoomSize = 0;
      this.zoomCache.set(e.pointerId,e);
    };
    events.onpointerleave = events.onpointerout = events.onpointerup = (e: PointerEvent) =>  { 
      this.dragStart = undefined;
      this.zoomCache.delete(e.pointerId);
      this.zoomSize = 0;
    };
    events.onwheel = (e: WheelEvent) => this.zoom(this.convert(e.offsetX, e.offsetY), e.deltaY > 0 ? 0.9 : 1.1);
    // Add our panel
    renderer.appendChild(this.host,events);
  }

  @ContentChildren(NgxZoomableDirective) items!: QueryList<NgxZoomableDirective>;

  public initializing: boolean = false;

  ngAfterContentInit(): void {
    // Child changes.
    this.items.changes.subscribe((list: QueryList<NgxZoomableDirective>) => {
      console.debug('NgxZoomPanelComponent', 'ngAfterContentInit', 'this.items.changes.subscribe(list)', list);
      this.invalidate();
      this.clamp();
      this.layout();
    });
    this.initializing = false;
    this.layout();
  }
  
  /** This is the primary matrix used to keep track of the transformation. */
  private matrix: DOMMatrix = new DOMMatrix();

  /**
   * Layout the managed child components from this.list (ie: the directives)
   */
  public layout(): void {
    this.items.forEach((item: NgxZoomableDirective) => item.layout(this.matrix));
  }

  /**
   * Translates a point from the component (rendered) space to the unzoomed content space. Can 
   * be used relate values to the original content. Point values may be negative.
   * 
   * @param point the point to translate.
   * @returns the input point translated to the unzoomed / unoffset coordinate space.
   */
  public convert = (x: number, y: number): DOMPoint => this.matrix.inverse().transformPoint(new DOMPoint(x,y));

  /**
   * Zoom on this point (which is in the **transformed** co-ordinate space).
   * 
   * @param point - at which we want to scale around.
   * @param scale - incremental scale (ie: < 1 to decrease zoom > 1 to increase zoom)
   */
  public zoom(point: DOMPoint, scale: number) {
    let target = this.matrix.a * scale;
    // Pin the scale
    scale = target >= this.zoomMax ? this.zoomMax / this.matrix.a : (target <= this.zoomMin ? this.zoomMin / this.matrix.a : scale);
    // Scale
    this.matrix = this.matrix.translate(point.x, point.y);
    this.matrix = this.matrix.scale(scale, scale);
    this.matrix = this.matrix.translate(-point.x, -point.y);
    // Layout
    this.clamp();
    this.layout();
  }

  public zoomIn = (): void => this.zoom(this.convert(this.hostBounds.width / 2, this.hostBounds.height / 2), 1.2);

  public zoomOut= (): void => this.zoom(this.convert(this.hostBounds.width / 2, this.hostBounds.height / 2), 0.8);

  public setZoom= (zoom: number): void => this.zoom(this.convert(this.hostBounds.width / 2, this.hostBounds.height / 2), zoom / (this.matrix.a || zoom));

  /**
   * Validity ie: is the information about the component and its children 
   * (dimensions etc) up to date.
   * 
   * `validate` and `invalidate` are designed to be called independently ie: 
   * methods that invalidate the component should call invalidate and method that 
   * require the component to be valid should call validate.
   */

  private valid: boolean = false;

  /** These keep track of the sizes of our two main objects */
  private contBounds: DOMRect = new DOMRect(0, 0, 0, 0);
  private hostBounds: DOMRect = new DOMRect(0, 0, 0, 0);

  private validate(): void {
    if (this.valid) return;
    // Measure the content.
    this.contBounds = this.items.reduce((rec: DOMRect, item: NgxZoomableDirective) => {
      let siz = item.size();
      return new DOMRect(
        Math.min(rec.x, siz.x),
        Math.min(rec.y, siz.y),
        Math.max(rec.right, siz.right) - Math.min(rec.x, siz.x),
        Math.max(rec.bottom, siz.bottom) - Math.min(rec.y, siz.y)
      );
    }, new DOMRect(0, 0, 0, 0));
    //
    console.debug('NgxZoomPanelComponent', 'validate', `this.contBounds:${this.contBounds.width}x${this.contBounds.height} @ ${this.contBounds.x},${this.contBounds.y}`);
    // Measure the host
    this.hostBounds = new DOMRect(0, 0, this.host.offsetWidth, this.host.offsetHeight);
    console.debug('NgxZoomPanelComponent', 'validate', `this.hostBounds:${this.hostBounds.width}x${this.hostBounds.height} @ ${this.hostBounds.x},${this.hostBounds.y}`);
    //
    this.valid = true;
  }

  private invalidate(): void {
    this.contBounds = new DOMRect(0, 0, 0, 0);
    this.hostBounds = new DOMRect(0, 0, 0, 0);
    this.valid = false;
  }

  /**
   * Causes the component to invalidate its layout and validate itself. This would typically 
   * be called when changes were made to child components that may not have triggered change detection.
   */
  public revalidate(): void {
    this.invalidate();
    this.validate();
  }
 
  private move(mX: number,mY: number): void {
    this.matrix = this.matrix.translate(mX,mY);
    this.clamp();
    this.layout();
  }

  /**
   * This is called to ensure that the content does not wander away from the edges of the component. 
   */
  private clamp(): void {
    this.validate();
    //
    let m: DOMMatrix = this.matrix;
    let s: number = Math.sqrt(m.a * m.a + m.b * m.b);
    m.e = Math.max(this.padding - ((this.contBounds.left + this.contBounds.width) * s), Math.min(this.hostBounds.width - (this.contBounds.left * s) - this.padding, m.e));
    m.f = Math.max(this.padding - ((this.contBounds.top + this.contBounds.height) * s), Math.min(this.hostBounds.height - (this.contBounds.top * s) - this.padding, m.f));
    this.matrix = m;
  }

  /**
   * This can be called to fit the contents of the 
   */
  public fit(): void {
    this.validate();
    let scale = Math.min((this.hostBounds.width - (this.padding * 2)) / this.contBounds.width, (this.hostBounds.height - (this.padding * 2)) / this.contBounds.height);
    this.zoomMin = Math.min(this.zoomMin, scale);
    this.matrix = new DOMMatrix([
      scale, 0, 0, scale, 
      ((this.hostBounds.width   - (this.contBounds.width * scale)) / 2) - (this.contBounds.x * scale) , 
      ((this.hostBounds.height  - (this.contBounds.height * scale)) / 2) - (this.contBounds.y * scale)]);
    this.layout();
  }

}
