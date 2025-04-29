declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: Element, opts?: MapOptions);
      panTo(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoomLevel: number): void;
      getZoom(): number;
      fitBounds(bounds: LatLngBounds, padding?: number | Padding): void;
      data: Data;
    }

    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      open(map?: Map, anchor?: MVCObject | null): void;
      close(): void;
      setContent(content: string | Element): void;
    }

    class LatLngBounds {
      constructor(sw?: LatLng | LatLngLiteral, ne?: LatLng | LatLngLiteral);
      extend(point: LatLng | LatLngLiteral): LatLngBounds;
    }

    class LatLng {
      constructor(lat: number, lng: number, noWrap?: boolean);
      lat(): number;
      lng(): number;
    }

    class Marker extends MVCObject {
      constructor(opts?: MarkerOptions);
      setMap(map: Map | null): void;
      getPosition(): LatLng | null;
      setPosition(latLng: LatLng | LatLngLiteral): void;
      addListener(eventName: string, handler: Function): MapsEventListener;
    }

    class MapsEventListener {
      remove(): void;
    }

    class MVCObject {
      constructor();
    }
    
    class event {
      static addListener(instance: object, eventName: string, handler: Function): MapsEventListener;
      static removeListener(listener: MapsEventListener): void;
    }

    class Data {
      forEach(callback: (feature: Data.Feature) => void): void;
      remove(feature: Data.Feature): void;
    }

    namespace Data {
      class Feature {}
    }

    const SymbolPath: {
      CIRCLE: number;
      FORWARD_CLOSED_ARROW: number;
      FORWARD_OPEN_ARROW: number;
      BACKWARD_CLOSED_ARROW: number;
      BACKWARD_OPEN_ARROW: number;
    };

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      streetViewControl?: boolean;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
    }

    interface InfoWindowOptions {
      content?: string | Element;
      position?: LatLng | LatLngLiteral;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map?: Map;
      title?: string;
      label?: string | MarkerLabel;
      icon?: string | Icon;
      draggable?: boolean;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface Icon {
      path: string | number;
      scale: number;
      fillColor?: string;
      fillOpacity?: number;
      strokeColor?: string;
      strokeWeight?: number;
    }

    interface Padding {
      top: number;
      right: number;
      bottom: number;
      left: number;
    }
  }
}