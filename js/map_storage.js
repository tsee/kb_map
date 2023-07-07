import { Hex } from '../vendor/hexagons/lib-module.js';

let num_tile_images_loaded = 0;

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

// wait for all tile images to be loaded
export function wait_for_tiles_loaded(callback) {
  if (num_tile_images_loaded < Object.keys(tile_types).length) {
    window.setTimeout(wait_for_tiles_loaded, 100, callback); /* this checks every 100 milliseconds*/
    return;
  } else {
    return callback();
  }
}

export class HexValue {
  constructor(type) {
    // store hex type // todo make some for of enum for this
    this.type = type;
  }
}

export class KBMap {
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

        this.map.set(new Hex(q, r, -q-r), new HexValue(0));
      }
    }
  }

  iterate(callback) {
    this.map.forEach(function(v, k, m) { callback(k, v); });
  }
}
