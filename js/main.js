
import {
  KBMap,
  TileType,
  tile_types,
  tile_types_order,
  HexValue,
  wait_for_tiles_loaded
} from './map_storage.js';

import { Hex, Layout, Point, OffsetCoord } from '../vendor/hexagons/lib-module.js';

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

  current_tile_type: "none",
};

state.board_ctx = state.board_canvas.getContext('2d');
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
function draw_hex(ctx, hex_value, draw_bg) {
  let p = layout.hexToPixel(hex_value.hex);

  if (!(draw_bg === undefined) && draw_bg) {
    ctx.fillRect(
      p.x, p.y,
      cfg.tile_width, cfg.tile_height
    );
  }

  let tt = tile_types[hex_value.type];

  // draw sprite first
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

  ctx.beginPath();
  ctx.moveTo(corners[5].x, corners[5].y);
  for (let i = 0; i < 6; ++i) {
    ctx.lineTo(corners[i].x, corners[i].y);
  }
  //ctx.fill();
  ctx.stroke();

  // debug helper: print hex coordinates into tile
  let debug_output = 0;
  if (debug_output) {
    ctx.font = "12px Arial";
    ctx.fillText(
      "ax:" + hex_value.hex.q + "," + hex_value.hex.r,
      (corners[0].x+corners[3].x)/2 - 20,
      (corners[0].y+corners[3].y)/2 - 6
    );
    let os = OffsetCoord.roffsetFromCube(1, hex_value.hex);
    ctx.fillText(
      "oc:" + os.col + "," + os.row,
      (corners[0].x+corners[3].x)/2 - 20,
      (corners[0].y+corners[3].y)/2 + 6
    );
  }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}

// a click on the board will update the clicked hex with the currently
// selected tile type
state.board_canvas.addEventListener('click', function(event) {
  let mpos = getMousePos(state.board_canvas, event);
  let p = screen_to_offsetcoord(new Point(mpos.x, mpos.y));
  let h = layout.pixelToHex(p).round();

  // update this tile to the currently selected tile type
  let hv = state.map.get(h.q, h.r);
  if (!(hv === undefined)) {
    hv.type = state.current_tile_type;
    refresh_board();
  }
}, false);

// a click on the selector will update the currently selected tile type
state.selector_canvas.addEventListener('click', function(event) {
  // Since the "click on the tile you want to use" logic will be a bit of effort later,
  // we'll just go with something very easy/simple/stupid: if you click on the selector
  // canvas, we'll just cycle to the next tile type. And in the silliest possible way:

  for (let i = 0; i < tile_types_order.length; i++) {
    if (tile_types_order[i] == state.current_tile_type) {
      // advance
      i++;
      // check wrap-around
      if (i >= tile_types_order.length)
        i = 0;
      state.current_tile_type = tile_types_order[i];
    }
  }
  refresh_board();

//state.selector_canvas_left = state.selector_canvas.offsetLeft + state.selector_canvas.clientLeft;
//state.selector_canvas_top = state.selector_canvas.offsetTop + state.selector_canvas.clientTop
//  let x = event.pageX - state.selector_canvas_left,
//      y = event.pageY - state.selector_canvas_top;

// TODO this doesn't work, of course, because it uses board coordinates and we're hacking wildly around with the selector. Need a new strategy, but leave it for now.
//  let p = screen_to_offsetcoord(new Point(x, y));
//  let h = layout.pixelToHex(p).round();
//  // update this tile to water type for testing
//  let hv = state.map.get(h.q, h.r);
//  if (!(hv === undefined)) {
//    hv.type = "water";
//    refresh_board();
//  }
}, false);


// redraw all canvases
function refresh_board() {
  // Update the main board:

  // full clear
  state.board_ctx.clearRect(0, 0, state.board_canvas.width, state.board_canvas.height);

  // draw all tiles from scratch
  state.board_ctx.strokeStyle = "black";
  state.map.iterate(function(v) {
      draw_hex(state.board_ctx, v);
  });

  // Update the selector canvas:
  // full clear
  state.selector_ctx.clearRect(0, 0, state.selector_canvas.width, state.board_canvas.height);

  // draw tiles into selector
  for (let i = 0; i < tile_types_order.length; i++) {
    let tt = tile_types_order[i];
    let hex = new Hex(-i/2 + (i%2), i);
    let hexval = new HexValue(hex, tt);

    if (tt == state.current_tile_type) {
      state.selector_ctx.strokeStyle = "black";
      state.selector_ctx.fillStyle = "red";
    } else {
      state.selector_ctx.strokeStyle = "black";
    }
    draw_hex(state.selector_ctx, hexval, (tt == state.current_tile_type));
  }

  // Update the tile stats display
  update_board_stats();
}

export function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
  });

  let draw_x_offset_cm = 0.5;
  let draw_y_offset_cm = 1.0;

  // local helper function to reduce copy/paste.
  // Yes, 'tis not the height of programming.
  let draw_hex_helper = function(v) {
    let tt = tile_types[v.type];
    let p = layout.hexToPixel(v.hex);
    const px_to_cm = 96/72 / (72/2.54);
    doc.addImage(
        tt.img, 'PNG',
        p.x * px_to_cm + draw_x_offset_cm,
        p.y * px_to_cm + draw_y_offset_cm,
        cfg.tile_width * px_to_cm,
        cfg.tile_height * px_to_cm,
        v.type
        );
  };

  // Now iterate over the map draw everything up to column 5 (by offset
  // coordinates, not axial/cube coordinates!) on the first page,
  // then add a page, iterate AGAIN and draw the rest.
  state.map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col >= 6)
        return;
      draw_hex_helper(v);
  });

  doc.addPage();
  draw_x_offset_cm = -17;
  state.map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col < 6)
        return;
      draw_hex_helper(v);
  });

  doc.save("map.pdf");
}

function update_board_stats() {
  // compute the stats
  let tile_count = {};
  for (let i = 0; i < tile_types_order.length; i++) {
    let typename = tile_types_order[i];
    tile_count[typename] = 0;
  }

  state.map.iterate(function(v) {
    tile_count[v.type]++;
  });

  // Set up the static part of the stats display. Generating this from Javascript
  // only because we don't want to hardcode the tile type name lists in HTML.
  let tile_name_td = document.querySelector("td.tilename");
  if (tile_name_td == null) {
    let names_tr = document.getElementById('tilenames');
    let counts_tr = document.getElementById('tilecounts');
    for (let i = 0; i < tile_types_order.length; i++) {
      let ntd = document.createElement("td");
      ntd.className = "tilename";
      ntd.textContent = tile_types_order[i];
      names_tr.appendChild(ntd);

      let ctd = document.createElement("td");
      ctd.className = "tilecount";
      ctd.textContent = "0";
      counts_tr.appendChild(ctd);
    }
  }

  // Update counts display
  let counts_tr = document.getElementById('tilecounts');
  let counter_tds = counts_tr.childNodes;
  if (counter_tds.length != tile_types_order.length)
    console.warn("Yikes, TD count for tile counters is not the same as static tile type counts.");

  for (let i = 0; i < tile_types_order.length; i++) {
    let td = counter_tds[i];
    td.textContent = tile_count[tile_types_order[i]];
  }
}


function main_loop() {
  console.log("main loop");
  //curmap.iterate(function(hv){console.log(hv);});

  // set a tile to a different type, just for testing
  //state.map.get(0, 0).type = state.current_tile_type;

  refresh_board();

  setInterval(function() {
      refresh_board();
    }, 1000
  );
}

wait_for_tiles_loaded(main_loop);

