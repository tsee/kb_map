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

// Generates a random (and hopefully somewhat reasonable) KBMap of the given
// dimensions and returns the new KBMap object.
export function generate_random_map(width, height) {
  let map = new KBMap(width, height);

  // generate a list of all tiles on the board (which are of type "none" right now)
  let tiles = [];
  map.iterate(function(v) {
      tiles.push(v);
  });

  // Compute water and mountain counts
  const impassable_tile_count = 20;
  // water = 1/3 to 3/4 of impassable tiles
  const water_count = Math.floor(impassable_tile_count/3 + Math.random() * Math.floor(impassable_tile_count*5/12))
  const mountain_count = impassable_tile_count - water_count;

  // We will place exactly two tiles of one type of these.
  let specials = ["oracle", "farm", "tavern", "tower", "harbour", "paddock", "barn", "oasis"];
  // each pair here is the target count of that tile type, followed by the placement algorithm function
  let total_tile_counts = {
    grass: [15, _flood_tiles],
    flowers: [15, _flood_tiles],
    forest: [15, _flood_tiles],
    desert: [15, _flood_tiles],
    canyon: [15, _flood_tiles],
    water: [water_count, _run_tiles_linear],
    mountain: [mountain_count, _run_tiles_linear],
  };

  // place one castle, avoid border and other castles
  let neighbors_to_avoid = ["castle"];
  _place_special_tiles(map, tiles, "castle", 1, neighbors_to_avoid);

  // place 2 special tiles (pick one random type)
  const selected_special = specials[ Math.floor(Math.random() * specials.length) ];
  neighbors_to_avoid.push(selected_special);
  _place_special_tiles(map, tiles, selected_special, 2, neighbors_to_avoid);

  // First we break up the configured # of tiles per type into individual plots
  // so we avoid having a huge space of the same tile type.
  // After this for loop, we should have a dict like this:
  // { "water": [fn, 7, 4, 3], "grass": [fn, 9, 5, 2], ...}
  // where the numbers are target plot sizes and fn is whichever function callback
  // will do the actual tile placement for this tile type
  let tile_counts = {};
  // TODO The numeric side of this isn't perfect and will need tuning.
  for (let [tt, spec] of Object.entries(total_tile_counts)) {
    let cnt = spec[0];
    tile_counts[tt] = [spec[1]];
    while (cnt > 0) {
      // each plot will be a random size between 1/4 of remaining tile count and 1/2
      let plot_size = Math.floor(cnt/4 + Math.random() * Math.floor(cnt/4));
      // Let's not try to have too many tiny plots:
      if (plot_size < 3)
        plot_size = cnt;
      cnt -= plot_size;
      tile_counts[tt].push(plot_size);
    }
  }

  // Now come the horrible nested loops that actually iterate through:
  //  - all tile types to generate (priority types first, then in random order)
  //  - each plot to generate for each tile type
  let prio_tile_count_placements = ["water", "mountain"];
  let tile_count_list = Object.keys(tile_counts);
  while (tile_count_list.length != 0) {
    // pick tile type from list (no put-back)
    let tt;

    // if we still have priority types to place, then do those in order.
    if (prio_tile_count_placements.length > 0) {
      tt = prio_tile_count_placements.shift();
      // oh boy, this is awful, but I'm in a rush.
      _remove_first_from_array(tile_count_list, tt);
    }
    // no more priority tile types to place, do all others in random order
    else {
      const i = Math.floor(Math.random() * tile_count_list.length);
      tt = tile_count_list[i];
      tile_count_list.splice(i, 1);
    }

    let plots = tile_counts[tt];
    delete tile_counts[tt];

    // function/callback that actually places the tiles
    const filler_routine = plots.shift();

    // try to place plots
    plots_placement: while (plots.length > 0) {
      let count = plots.splice(0, 1)[0];
      // now keep placing flood fills until we've finished placing the entire plot's worth
      while (count > 0) {
        const c = filler_routine(tt, count, tiles, map);
        if (c == count) break plots_placement; // board full?
        count = c;
      }
    }
  }

  // TODO also place some filler (water and mountain).
  // ... or leave that up to the user

  return map;
}

// place a number of special tiles on the map
function _place_special_tiles(map, tiles, special_tile_type, count, avoid_tile_types) {
  let special_tile;
  while (count > 0) {
    special_tile = _random_tile(tiles);

    // redo if not eligible
    if ( _is_border_hex(special_tile.hex, map)
         || _is_neighbor_to_type(special_tile, map, avoid_tile_types) )
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

// gets all hexval neighbors that are within the map AND empty
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
function _is_neighbor_to_type(tile, map, banned_types) {
  let n = _get_neighbors(tile.hex, map);
  for (let i = 0; i < n.length; i++) {
    if (banned_types.includes(n[i].type))
      return true;

  }
  return false;
}

// returns the number of neighbors of the given types
function _count_neighbors_of_type(tile, map, types) {
  let n = _get_neighbors(tile.hex, map);
  let c = 0;
  for (let i = 0; i < n.length; i++) {
    if (types.includes(n[i].type))
      c++;
  }
  return c;
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

// similar to _flood_tiles, this places tiles of the given type,
// except this algorithm refuses to place tiles with more too many
// neighbors of the same type, thus creating more linear runs.
function _run_tiles_linear(tile_type, count, free_tiles_list, map) {
  let start_tiles = [ _random_tile(free_tiles_list) ];
  while (start_tiles.length > 0 && count > 0) {
    let start_tile = start_tiles.pop();
    start_tile.type = tile_type;
    count--;

    let n = _get_empty_neighbors(start_tile.hex, map);
    _shuffle_array(n);
    for (let i = 0; i < n.length; i++) {
      const tile = n.pop();
      if (_count_neighbors_of_type(tile, map, [tile_type]) <= 2) {
        start_tiles.push(tile);
      }
    }
  }
  return count;
}


// simple helper to remove the first array element from an array that is equal to
// the second parameter
function _remove_first_from_array(array, to_remove) {
  for (let i = 0; i < array.length; i++) {
    if (array[i] == to_remove) {
      array.splice(i, 1);
      break;
    }
  }
}
