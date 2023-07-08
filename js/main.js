
import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
  wait_for_tiles_loaded
} from './map_storage.js';

import { Hex, Layout, Point } from '../vendor/hexagons/lib-module.js';

// static config
let cfg = {};
// board size in hex's
cfg.row_size = 10;
cfg.col_size = 10;
// dimensions of the primary board canvas
cfg.board_canvas_width = 750;
cfg.board_canvas_height = 550;
// dimensions of the primary board
cfg.grid_height = 700;
cfg.grid_width  = 700;
// tile sizes based on the above
cfg.tile_height = cfg.grid_height / cfg.col_size;
cfg.tile_width  = cfg.grid_width  / cfg.row_size;
// tile input image dimensions
cfg.tile_img_width = 400;
cfg.tile_img_height= 464;

// KB uses a pointy ("pointy bit on top") rectangular 10x10 map
let layout = new Layout(
  Layout.pointy,
  // tile sizes in both dimensions. Size means half of the longer diameter.
  new Point(cfg.tile_width / Math.sqrt(3), cfg.tile_height / 2),
  // origin coords
  new Point(0, 0)
);

// dynamic state, including drawing elements
let state = {
  // Main map storage
  map: new KBMap(cfg.row_size, cfg.col_size),
  // canvases used:
  // main canvas for drawing the board
  board_canvas: document.getElementById('board-canvas'),
  // canvas used for drawing the tile selector
  selector_canvas: document.getElementById('selector-canvas'),

  current_tile_type: "water",
};

state.board_ctx = state.board_canvas.getContext('2d');
state.board_canvas_left = state.board_canvas.offsetLeft + state.board_canvas.clientLeft;
state.board_canvas_top = state.board_canvas.offsetTop + state.board_canvas.clientTop

state.selector_ctx = state.selector_canvas.getContext('2d');


// these two utility functions just translate the offset coordinates to screen
// coordinates and back. That's because the origin of the offset coordinates is
// at the center of a Hex and not at the corner of the enveloping rectangle.
function offsetcoord_to_screen(p) {
  return new Point(p.x + cfg.tile_width / 2., p.y + cfg.tile_height / 2.);
}

function screen_to_offsetcoord(p) {
  return new Point(p.x - cfg.tile_width / 2., p.y - cfg.tile_height / 2.); 
}


// Function to fully draw a new hex onto the canvas
function draw_hex(ctx, hex_value) {
  let tt = tile_types[hex_value.type];
  //console.log(p);

  // draw sprite first
  let p = layout.hexToPixel(hex_value.hex);
  ctx.drawImage(
    tt.img,
    0, 0, // pos in source img
    cfg.tile_img_width, cfg.tile_img_height, // size of source crop
    p.x, p.y, // dest in canvas top left
    cfg.tile_width, cfg.tile_height// size in output
  );

  // then for fun also draw a hex made of lines
  let corners = layout.polygonCorners(hex_value.hex);
  for (let i = 0; i < 6; ++i) {
    corners[i] = offsetcoord_to_screen(corners[i]);
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


state.board_canvas.addEventListener('click', function(event) {
  let x = event.pageX - state.board_canvas_left,
      y = event.pageY - state.board_canvas_top;

  let p = screen_to_offsetcoord(new Point(x, y));

  let h = layout.pixelToHex(p).round();

  // update this tile to water type for testing
  let hv = state.map.get(h.q, h.r);
  if (!(hv === undefined)) {
    hv.type = "water";
    refresh_board();
  }
}, false);

function refresh_board() {
  // Update the main board:

  // full clear
  state.board_ctx.clearRect(0, 0, state.board_canvas.width, state.board_canvas.height);

  // draw all tiles from scratch
  state.map.iterate(function(v) {
      draw_hex(state.board_ctx, v);
  });

  // Update the selector canvas:
  state.selector_ctx.clearRect(0, 0, state.selector_canvas.width, state.board_canvas.height);
}

function main_loop () {
  console.log("main loop");
  //curmap.iterate(function(hv){console.log(hv);});

  // set a tile to a different type, just for testing
  state.map.get(0, 0).type = state.current_tile_type;

  refresh_board();

  setInterval(function() {
      refresh_board();
    }, 1000
  );
}

wait_for_tiles_loaded(main_loop);

