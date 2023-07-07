
import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
  wait_for_tiles_loaded
} from './map_storage.js';

import { Hex, Layout, Point } from '../vendor/hexagons/lib-module.js';

let canvas_height = 700;
let canvas_width = 700;
let row_size = 10;
let col_size = 10;
let tile_height = canvas_height / col_size;
let tile_width  = canvas_width / row_size;

// KB uses a pointy ("pointy bit on top") rectangular 10x10 map
let layout = new Layout(
  Layout.pointy,
  // canvas width, canvas height
  //new Point(700, 700),
  new Point(tile_width/2, tile_height/2),
  // origin coords
  new Point(0, 0)
);

//let border_width = 10;

let tile_img_width = 400;
let tile_img_height= 464;

//let tile_height = (canvas_height - 2*border_width) / col_size;
//let tile_width  = (canvas_width  - 2*border_width) / row_size;

// row size, col size
let curmap = new KBMap(10, 10);
curmap.iterate(function(hx) {
  console.log("q="+hx.hex.q+" r="+hx.hex.r+" type="+hx.type);
});

function draw_hex(ctx, hex_value) {
  let tt = tile_types[hex_value.type];
  let p = layout.hexToPixel(hex_value.hex);
  //console.log(p);

  ctx.drawImage(
    tt.img,
    0, 0, // pos in source img
    tile_img_width, tile_img_height, // size of source crop
    p.x, p.y, // dest in canvas top left
    // TODO the subtractions here are just for finagling the crappy source images into a reasonable display
    tile_width-9, tile_height-1// size in output
  );
}

let canvas = document.getElementById('board-canvas');
let ctx = canvas.getContext('2d');
let canvas_left = canvas.offsetLeft + canvas.clientLeft;
let canvas_top = canvas.offsetTop + canvas.clientTop

//canvas.addEventListener('click', function(event) {
//  let x = event.pageX - canvas_left,
//      y = event.pageY - canvas_top;
//
//  let tile_pos = find_tile_from_canvas_coordinates(x, y);
//
//  // this is just for testing
//  update_tile_type(tile_pos.col, tile_pos.row, "desert");
//}, false);

// // this is just for testing
//async function update_tile_type(col, row, type) {
//  let resp = await fetch('/board_set?col=' + col + ";row=" + row + ";type=" + type);
//}

async function refresh_board() {
  // full clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // draw all tiles from scratch
  curmap.iterate(function(v) {
      draw_hex(ctx, v);
  });
}

function main_loop () {
  console.log("main loop");
  curmap.iterate(function(hv){console.log(hv);});

  // set a tile to a different type, just for testing
  curmap.get(0, 0).type = "water";
  curmap.get(1, 0).type = "castle";
  curmap.get(0, 1).type = "forest";
  curmap.get(1, 1).type = "desert";

  setInterval(function() {
      refresh_board();
    }, 100
  );
}

wait_for_tiles_loaded(main_loop);

