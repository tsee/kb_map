import { Hex } from '../vendor/hexagons/lib-module.js';

// just used for wait_for_tiles_loaded() so a main loop can be kicked off after loading
let num_tile_images_loaded = 0;

// These are going to be created as sort of singletons that are stashed in the tile_types
// exportable const. HexValue's then only have to store a type name instead of the real thing.
// I might regret this design.
export class TileType {
  constructor(name, path) {
    this.name = name;
    this.path = path;
    this.img = new Image();
    this.img.onload = function(){ ++num_tile_images_loaded; };
    this.img.src = path;
  }
};

export const tile_types = {
  none: new TileType("none", "../img/white_with_cross.png"),
  grass: new TileType("grass", "../img/green.png"),
  forest: new TileType("forest", "../img/dark_green.png"),
  flowers: new TileType("flowers", "../img/violet.png"),
  desert: new TileType("desert", "../img/yellow.png"),
  canyon: new TileType("canyon", "../img/brown.png"),
  water: new TileType("water", "../img/blue.png"),
  mountain: new TileType("mountain", "../img/dark_gray.png"),
  castle: new TileType("castle", "../img/castle.png"),
};

export const tile_types_order = [
  "none", "grass", "forest", "flowers", "desert", "canyon", "water", "mountain", "castle"
];

// wait for all tile images to be loaded and then invoke callback
export function wait_for_tiles_loaded(callback) {
  if (num_tile_images_loaded < Object.keys(tile_types).length) {
    window.setTimeout(wait_for_tiles_loaded, 100, callback); /* this checks every 100 milliseconds*/
    return;
  } else {
    return callback();
  }
}

// container for a value in the KBMap
// hex is the hex this represents
// type is a string that needs to exist in the tile_types lookup
export class HexValue {
  constructor(hex, type) {
    // store hex type // todo make some for of enum for this
    if (!(type in tile_types)) {
      console.warn("Invalid tile type: '" + type + "' during HexValue creation");
    }
    this.hex = hex;
    this.type = type;
  }
}

export class KBMap {
  // construct rectangular pointy-top map of given width and height
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.map = new Map();

    let _top = 0;
    let bottom = height-1;
    let left = 0;
    let right = width-1;

    for (let r = _top; r <= bottom; r++) {
      let r_offset = Math.floor(r/2.0);
      for (let q = left - r_offset; q <= right - r_offset; q++) {
        this.map.set(q + "," + r, new HexValue(new Hex(q, r), "none"));
      }
    }
  }

  // iterate over all hex's in the map, invoking the callback with the HexValue as arguments
  iterate(callback) {
    this.map.forEach(function(v, k, m) { callback(v); });
  }

  get(q, r) {
    return this.map.get(q + "," + r);
  }

  get_exists(q, r) {
    let hv = this.map.get(q + "," + r);
    if (hv === undefined) {
      throw "Trying to fetch non-existant map element";
    }
    return hv;
  }

  set(q, r, hxval) {
    this.map.set(q + "," + r, hxval);
  }
}
