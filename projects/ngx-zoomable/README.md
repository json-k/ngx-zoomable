# NgxZoomable

Zoomable is a component for Angular that serves as a container for other components that can zoom and pan its children.

## Installation

```bash
npm install ngx-zoomable --save
```

## Use

The `ngx-zoomable` component manages it's contents - identified by the `ngx-zoomable` directive - allowing them to be zoomed and panned by touch or mouse input.

```html
  <ngx-zoomable #zoompanel [clipped]="true" [padding]=20>
    <img ngxZoomable src="some/image.jpg"
      [style.display]="zoompanel.initializing?'none':'block'"
      [x]=0 
      [y]=0 
      [w]=800 
      [h]=600>
  <ngx-zoomable>
```

### Zoomable Component (`ngx-zoomable`)

The parent component managing the children.

| **Attribute** | **Use** |
|-|-|
| **clipped** | When set to `true  ` the contents will be clipped at the bounds of the `ngx-zoomable` component. |
| **padding** | When `fit()` is called the contents will be arranged leaving at least this many pixels on each side. In addition this value is used to limit the travel of the contents from the view eg: when set to 20 there will be at least 20px of the contents showing at any given time. |
| **zoomMax** | The maximum zoom. Note: if calling `fit()` will result in this value being exceded - this value is increased to the required zoom ie: if you make the parent component very small and call fit the result will be as expected. |
| **zoomMin** | The minimum zoom. |
| **initializing** | A boolean set to `true` by the component when `ngAfterContentInit()` is complete. |
| **Method** | **Use** |
| **revalidate()** | Causes the component to (re)evaluated the size of it's managed child components. This can / should be called when a change to the size of the component may effect its size eg: an image changes source. |
| **fit()** | Sets the 'offset' and 'zoom' level to display the child contents in the current component bounds (minus the `padding` (px)). |
| **zoomIn()** | Increases zoom (around the center of the view). |
| **zoomOut()** | Decreases zoom (around the center of the view). |
| **setZoom(zoom)** | Sets the specific zoom level. |

### Zoomable Directive (`ngxZoomable`)

The items to manage are identified with a directive `ngxZoomable` with defined coordinate values (x,y) and width and height (w,h) - relative to each other before any transformations are applied.

**Example:** _an element with x=0, y=0, w=20, h=10 would be 20px width at a 1x zoom and 40px wide at 2x zoom. Another elemement with x=-5 would be 5px to the left of that element at 1x zoom and 10px at 2x._

| **Attribute** | **Use** |
|-|-|
| **x** | The coordinate position of the furthest left edge of the element. |
| **y** | The coordinate position of the furthest top edge of the element. |
| **w (number)** | The element will be rendered this many pixels wide multipled by the zoom level ie: w=45 at 10x zoom would display with a 450px width. |
| **w ('AUTO')** | The element will be rendered at it's natural width ie: no transformation will be applied. Eg: a 1em p tag will have the same sized text regardless of zoom level. |
| **w ('SCALE')** | The element's width will be scaled according to the zoom level. Unlike using a number which sets the bounds of the element this method applies a transformational scale (with the top left as the origin) to the element. |
| **h (number)** | Managed height (see above). |
| **h ('AUTO')** | Auto height (see above). |
| **h ('SCALE')** | Scaled height (see above). |
| **pointer** | When set to `true` (default is false) pointer events are processed on the element - meaning that the area of this component can no longer be used for changing pan or zoom - but the component would act as expected otherwise. |