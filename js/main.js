
import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
  wait_for_tiles_loaded
} from './map_storage.js';

import { Hex, Layout, Point, OffsetCoord } from '../vendor/hexagons/lib-module.js';
//import { Hex, Layout, Point } from '../vendor/hexagons/lib-module.js';

let canvas_height = 700;
let canvas_width = 700;
let row_size = 10;
let col_size = 10;
let tile_height = canvas_height / col_size;
let tile_width  = canvas_width / row_size;

function offset_to_screen(p) {
  return new Point(p.x + tile_width/2., p.y + tile_height/2.);
}

function screen_to_offset(p) {
  return new Point(p.x - tile_width/2., p.y - tile_height/2.); 
}

// KB uses a pointy ("pointy bit on top") rectangular 10x10 map
let layout = new Layout(
  Layout.pointy,
  // tile sizes in both dimensions. Size means half of the longer diameter.
  new Point(tile_width/2, tile_height/2),
  // origin coords
  new Point(0, 0)
);

let tile_img_width = 400;
let tile_img_height= 464;

// Main map storage
// row size, col size
let curmap = new KBMap(10, 10);

function draw_hex(ctx, hex_value) {
  draw_hex2(ctx, hex_value);
  let tt = tile_types[hex_value.type];
  //let p = layout.hexToPixel(hex_value.hex);
  //console.log(p);

  let corners = layout.polygonCorners(hex_value.hex);
  for (let i = 0; i < 6; ++i) {
    corners[i] = offset_to_screen(corners[i]);
  }

  //console.log(corners);
  ctx.beginPath();
  ctx.moveTo(corners[5].x, corners[5].y);
  for (let i = 0; i < 6; ++i) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  //ctx.fill();
  ctx.stroke();
}

function draw_hex2(ctx, hex_value) {
  let tt = tile_types[hex_value.type];
  let p = layout.hexToPixel(hex_value.hex);
  //console.log(p);

  ctx.drawImage(
    tt.img,
    0, 0, // pos in source img
    tile_img_width, tile_img_height, // size of source crop
    p.x, p.y, // dest in canvas top left
    // TODO the subtractions here are just for finagling the crappy source images into a reasonable display
    tile_width, tile_height// size in output
  );
}

let canvas = document.getElementById('board-canvas');
let ctx = canvas.getContext('2d');

let canvas_left = canvas.offsetLeft + canvas.clientLeft;
let canvas_top = canvas.offsetTop + canvas.clientTop

canvas.addEventListener('click', function(event) {
  let x = event.pageX - canvas_left,
      y = event.pageY - canvas_top;

  let p = screen_to_offset(new Point(x, y));
  //console.log(x, y);
  //console.log(p);

  let h = layout.pixelToHex(p).round();

  // update this tile to water type for testing
  let hv = curmap.get(h.q, h.r);
  if (!(hv === undefined)) {
    hv.type = "water";
  }
  //console.log(h);
}, false);

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

