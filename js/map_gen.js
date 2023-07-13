"use strict";

import { Hex, Layout, Point, OffsetCoord } from '../vendor/hexagons/lib-module.js';
import {
  KBMap,
  TileType,
  HexValue,
} from './map_storage.js';

// TODO this is a mess and needs refactoring

// This entire map generation logic is not only messy but also extremely inefficient.
// Thankfully, on a 10x10 map on human interaction time scales, the efficiency isn't
// really very important, so I'm instead going for "straightforward to implement".
// Noting this just in case a reader wonders if I know basic data structures and
// algorithms. :)

// Secondly, I'm brazenly ignoring the possibility that somewhere in this mess of
// algorithms, one could end up in a mix of conditions that aren't satisfiable
// and the entire thing just goes into an infinte loop.
// Thankfully, that'll be fixable by reloading the page and given that this is
// a whole-map-generation hack anyway, nothing of substance will be lost.

// generates a random (and hopefully somewhat reasonable) KBMap of the given
// dimensions and returns the new KBMap object.
export function generate_random_map(width, height) {
  let map = new KBMap(width, height);

  // generate a list of all tiles on the board (which are of type "none" right now)
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

  // place one castle, avoid border and other castles
  _place_special_tiles(map, tiles, "castle", 1, ["castle"]);

  // place 2 special tiles (pick one random type)
  const selected_special = specials[ Math.floor(Math.random() * specials.length) ];
  _place_special_tiles(map, tiles, selected_special, 2, ["castle", selected_special]);

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

  // TODO also place some filler (water and mountain).

  return map;
}

// place a number of special tiles on the map
function _place_special_tiles(map, tiles, special_tile_type, count, avoid_tile_types) {
  let special_tile;
  while (count > 0) {
    special_tile = _random_tile(tiles);

    // redo if not eligible
    if ( _is_border_hex(special_tile.hex, map)
         || _neighbor_to_type(special_tile, map, avoid_tile_types) )
    {
      tiles.push(special_tile);
    } else {
      special_tile.type = special_tile_type;
      count--;
    }
  }
}

// (inefficiently) determines whether the given Hex is at the border of the map
function _is_border_hex(hex, map) {
  // This is just so quick and easy I couldn't resist.
  // In principle, it should be 'easy' to do based on the knowledge of the
  // width/height of the rectangular map, and some basic math on axial coordinates.
  // Or maybe by converting to offset coordinates and just using even simpler math.
  // TODO optimize if I'm ever bored.
  const n = _get_neighbors(hex, map);
  return (n.length !=6);
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

// returns whether or not the given tile is neighbor to at least one tile of
// a type listed in the banned_types array
function _neighbor_to_type(tile, map, banned_types) {
  let n = _get_neighbors(tile.hex, map);
  for (let i = 0; i < n.length; i++) {
    if (banned_types.includes(n[i].type))
      return true;

  }
  return false;
}

// Randomize array in-place using Durstenfeld shuffle algorithm
function _shuffle_array(array) {
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
    _shuffle_array(n);
    for (let i = 0; i < n.length; i++) {
      start_tiles.push(n.pop());
    }
  }
  return count;
}
