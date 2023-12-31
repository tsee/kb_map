import { Hex } from '../vendor/hexagons/lib-module.js';

// just used for wait_for_images_loaded() so a main loop can be kicked off after loading
let num_images_loaded = 0;
export function increment_images_loaded() {
  num_images_loaded++;
}

// These are going to be created as sort of singletons that are stashed in the tile_types
// exportable const. HexValue's then only have to store a type name instead of the real thing.
// I might regret this design.
export class TileType {
  constructor(name, low_count, high_count, path) {
    this.name = name;
    // typical/sensible low/high tile counts for this type
    this.low_tile_count = low_count;
    this.high_tile_count = high_count;
    this.path = path;
    this.img = new Image();
    this.img.onload = increment_images_loaded,
    this.img.src = path;
  }
};

// increment this for any change to tile_types or tile_types_version.
export const tile_types_version = 2;

// These generally just update to the next most recent version and then chain.
const version_upgrades = {
  1: function(obj) {
    // 1->2 is just a type set expansion, no chnages required
    obj.version = 2;
  },
};

// type str, typical low count, typical high count, img path
const tile_path = "../img/tiles/"
export const tile_types = {
  none:     new TileType("none",     0, 0, tile_path + "white_with_cross.png"),
  grass:    new TileType("grass",    10, 25, tile_path + "grass.png"),
  forest:   new TileType("forest",   10, 25, tile_path + "forest.png"),
  flowers:  new TileType("flowers",  10, 25, tile_path + "flowers.png"),
  desert:   new TileType("desert",   10, 25, tile_path + "desert.png"),
  canyon:   new TileType("canyon",   10, 25, tile_path + "canyon.png"),
  water:    new TileType("water",    2, 20, tile_path + "water.png"),
  mountain: new TileType("mountain", 2, 20, tile_path + "mountain.png"),
  castle:   new TileType("castle",   1, 2, tile_path + "castle.png"),
  oracle:   new TileType("oracle",   0, 3, tile_path + "oracle.png"),
  farm:     new TileType("farm",     0, 3, tile_path + "farm.png"),
  tavern:   new TileType("tavern",   0, 3, tile_path + "tavern.png"),
  tower:    new TileType("tower",    0, 3, tile_path + "tower.png"),
  harbour:  new TileType("harbour",  0, 3, tile_path + "harbour.png"),
  paddock:  new TileType("paddock",  0, 3, tile_path + "paddock.png"),
  barn:     new TileType("barn",     0, 3, tile_path + "barn.png"),
  oasis:    new TileType("oasis",    0, 3, tile_path + "oasis.png"),
};

// Define a consistent order of tile type (names)
export const tile_types_order = [
  "none", "grass", "forest", "flowers", "desert", "canyon", "water", "mountain", "castle",
  "oracle", "farm", "tavern", "tower", "harbour", "paddock", "barn", "oasis",
];

// wait for all tile images to be loaded and then invoke callback
export function wait_for_images_loaded(callback) {
  // The +1 below is for the black box image we use for calibration?
  // Why use an image for that at all, you ask? Good question. Superstition!
  // By using an image --- which is what we use for drawing the maps --- we avoid
  // any bugs that might affect PDF line drawing differently from PDF image drawing.
  // Yeah, again, it's just superstition.
  if (num_images_loaded < Object.keys(tile_types).length + 1) {
    // this checks every 100 milliseconds
    window.setTimeout(wait_for_images_loaded, 100, callback);
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

function map_to_json(map) {
  return JSON.stringify(Object.fromEntries(map));
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

  // Yes the serialization/deserialization code is another example
  // of how much I don't know my javascript. Sue me. :)
  to_json() {
    const obj = {
      version: tile_types_version,
      width: this.width,
      height: this.height,
      map: Object.fromEntries(this.map),
    };
    return JSON.stringify(obj);
  }

  static from_json(json) {
    const obj = JSON.parse(json);

    // very old exports didn't have a version
    if (obj.version === undefined)
      obj.version = 1;

    // Attempt to upgrade the format to the newest version
    if (obj.version != tile_types_version) {
      if (version_upgrades[obj.version] === undefined) {
        alert("Incompatible map version (loading v" + obj.version + "), correctness might suffer.");
      } else {
        // Have an auto-upgrader! Apply it.
        version_upgrades[obj.version](obj);
      }
    }

    let kbmap = new KBMap(obj.width, obj.height);
    const json_map = obj.map;
    const coords = Object.keys(json_map);
    for (let i = 0; i < coords.length; i++) {
      const c = coords[i];
      const q = json_map[c].hex.q;
      const r = json_map[c].hex.r;
      let hv = new HexValue(new Hex(q, r), json_map[c].type);
      kbmap.set(q, r, hv);
    }
    return kbmap;
  }
}
