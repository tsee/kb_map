"use strict";

import { Hex, Layout, Point, OffsetCoord } from '../vendor/hexagons/lib-module.js';
import {
  KBMap,
  TileType,
  HexValue,
} from './map_storage.js';

// TODO this is a mess and needs refactoring
export function generate_random_map(width, height) {
  let map = new KBMap(width, height);

  let tiles = [];
  map.iterate(function(v) {
      tiles.push(v);
  });
  let specials = ["oracle", "farm", "tavern", "tower", "harbour", "paddock", "barn", "oasis"];
  let tile_counts = {
    grass: 15,
    flowers: 15,
    forest: 15,
    desert: 15,
    canyon: 15,
  };

  // place one castle
  let castle_tile = _random_tile(tiles);
  castle_tile.type = "castle";

  // place 2 special tiles (pick one random type)
  let selected_special = specials[ Math.floor(Math.random() * specials.length) ];
  for (let i = 0; i < 2; i++) {
    let t = _random_tile(tiles);
    if (_not_surrounded_by(t, map, ["castle", selected_special])) {
      t.type = selected_special;
    } else {
      i--;
      tiles.push(t);
    }
  }

  // Flood fill the regular tile types
  let tile_count_list = Object.keys(tile_counts);
  while (tile_count_list.length != 0) {
    const i = Math.floor(Math.random() * tile_count_list.length);
    const tt = tile_count_list[i];
    tile_count_list.splice(i, 1);
    let count = tile_counts[tt];
    delete tile_counts[tt];

    while (count > 0) {
      const c = _flood_tiles(tt, count, tiles, map);
      if (c == count) break; // board full?
      count = c;
    }
  }

  return map;
}

// picks a random tile from a list of tiles without put-back
function _random_tile(tiles) {
  let i = Math.floor(Math.random() * tiles.length);
  let tile = tiles[i];
  tiles.splice(i, 1);
  return tile;
}

// gets all hexval neighbors that are within the map
function _get_neighbors(hex, map) {
  let neighbors = [];

  // Hex -> 6 directions
  for (let i = 0; i < 6; ++i) {
    let nh = hex.neighbor(i);

    // only add the hex's that fall within the map
    let hv = map.get(nh.q, nh.r);
    if (!(hv === undefined)) {
      neighbors.push(hv);
    }
  }

  return neighbors;
}

function _get_empty_neighbors(hex, map) {
  let n = _get_neighbors(hex, map);
  for (let i = 0; i < n.length; i++) {
    if (n[i].type != "none") {
      n.splice(i, 1);
      i--;
    }
  }
  return n;
}

function _not_surrounded_by(tile, map, banned_types) {
  // TODO implement logic to check surrounding tiles such that they're not of the given types
  // tile == HexValue (location
  // map == KBMap
  // banned_types == array of tile type names
  return true;
}

// Randomize array in-place using Durstenfeld shuffle algorithm
function shuffle_array(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// a naive sort of randomized flood fill for tiles
// starting from a random free tile (from free_tiles_list),
// sets its type to tile_type and keeps moving out form there
// until the count is reached or it runs out of free adjacent
// tiles.
// returns the number of remaining tiles to fill
function _flood_tiles(tile_type, count, free_tiles_list, map) {
  let start_tiles = [ _random_tile(free_tiles_list) ];
  while (start_tiles.length > 0 && count > 0) {
    let start_tile = start_tiles.pop();
    start_tile.type = tile_type;
    count--;

    let n = _get_empty_neighbors(start_tile.hex, map);
    shuffle_array(n);
    for (let i = 0; i < n.length; i++) {
      start_tiles.push(n.pop());
    }
  }
  return count;
}
