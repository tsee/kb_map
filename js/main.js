
import { KBMap, TileType, HexValue, wait_for_tiles_loaded } from './map_storage.js';

let canvas_width = 700;
let canvas_height = 700;
let border_width = 10;

let tile_img_width = 400;
let tile_img_height= 346;

let row_size = 10;
let col_size = 10;
let tile_height = (canvas_height - 2*border_width) / col_size;
let tile_width  = (canvas_width  - 2*border_width) / row_size;

let curmap = new KBMap(row_size, col_size);
curmap.iterate(function(hx, hxval) {
  console.log("q="+hx.q+" r="+hx.r);
});

function Tile (col, row, typename) {
  this.col = col; // from 0
  this.row = row; // from 0
  this.canvas_x = 0; // top left corner of tile (to be computed)
  this.canvas_y = 0;
  this.typename = typename;
  update_canvas_pos(this);
}

function update_canvas_pos(tile) {
  // hexagon:
  // height = sqrt(3)*a
  // a = height/sqrt(3)
  //let a = tile_height / Math.sqrt(3);
  tile.canvas_y = border_width + tile.row * tile_height;
  if (tile.col % 2 == 1) {
    tile.canvas_y += tile_height/2
  }

  tile.canvas_x = border_width + (tile_width + tile_height/Math.sqrt(3))/2 * tile.col;
}

function draw_tile(ctx, tile) {
  let tt = tile_types[tile.typename];
  ctx.drawImage(
    tt.img,
    0, 0, // pos in source img
    tile_img_width, tile_img_height, // size of source crop
    tile.canvas_x, tile.canvas_y, // dest in canvas top left
    tile_width, tile_width // size in output
  );
}

let canvas = document.getElementById('board-canvas');
let ctx = canvas.getContext('2d');
let canvas_left = canvas.offsetLeft + canvas.clientLeft;
let canvas_top = canvas.offsetTop + canvas.clientTop

// TODO this is nonsense logic, just undoing the placement of the rectangular sprites.
// Need to do real hexagonal math / coordinate transformation
function find_tile_from_canvas_coordinates(x, y) {
  x -= border_width;
  y -= border_width;
  var col = x / ((tile_width + tile_height/Math.sqrt(3))/2) - 0.5;
  var tile_col = Math.floor(col);
  var row = y;
  if (tile_col % 2 == 1) {
    row -= tile_height / 2;
  }
  row = row / tile_height;
  var tile_row = Math.floor(row);

  console.log("x="+x+" y="+y+" col="+col + " colCoord="+tile_col+" row="+row + " rowCoord="+tile_row); 
  return {col: tile_col, row: tile_row};
}

canvas.addEventListener('click', function(event) {
  let x = event.pageX - canvas_left,
      y = event.pageY - canvas_top;

  let tile_pos = find_tile_from_canvas_coordinates(x, y);

  // this is just for testing
  update_tile_type(tile_pos.col, tile_pos.row, "desert");
}, false);

  // this is just for testing
async function update_tile_type(col, row, type) {
  let resp = await fetch('/board_set?col=' + col + ";row=" + row + ";type=" + type);
}

async function refresh_board() {
  let resp = await fetch('/board');
  let board = await resp.json();
  let tiles = board["tiles"];
  // full clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < col_size; ++row) {
    for (let col = 0; col < row_size; ++col) {
      let i = row * row_size + col;
      draw_tile(ctx, new Tile(col, row, tiles[i]));
    }
  }
  //draw_tile(ctx, new Tile(1, 2, "flowers"));
}

function main_loop () {
  console.log("main loop");
  //setInterval(function() {
  //    refresh_board();
  //  }, 100
  //);
}

wait_for_tiles_loaded(main_loop);

// Create our image
//let newImage = new Image();
//newImage.src = 'img/blue.png'

// When it loads
//newImage.onload = () => {
    // Draw the image onto the context
//    ctx.drawImage(newImage, 0, 0, 25, 25);
//}

