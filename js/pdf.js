"use strict";

// Adjust this for calibration. If you print a calibration PDF and find that the 100mm
// bar in the width (x) direction is actually only 99mm long, you set this to 0.99 instead of 1.00.
const printer_x_calibration_factor = 1.00;
const printer_y_calibration_factor = 1.00;

function _print_horiz_scale(x) {
  return x / printer_x_calibration_factor;
}
function _print_vert_scale(y) {
  return y / printer_y_calibration_factor;
}

import {
  KBMap,
  TileType,
  tile_types,
  HexValue,
} from './map_storage.js';

import { Point, OffsetCoord, Layout } from '../vendor/hexagons/lib-module.js';
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function generate_map_pdf(cfg, map) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
  });

  // TODO get the tile side ACTUALLY right
  const tile_side_in_cm = 1.5;
  const tile_width_in_cm = Math.sqrt(3) * tile_side_in_cm;
  const tile_height_in_cm = 2 * tile_side_in_cm; // for pointy side up

  const print_layout = new Layout(
    Layout.pointy,
    // tile sizes in both dimensions in cm.
    new Point(tile_width_in_cm / Math.sqrt(3), tile_height_in_cm / 2),
    // origin coords
    new Point(0, 0)
  );

  let draw_x_offset_cm = 1.5;
  let draw_y_offset_cm = 1.5;

  // local helper function to reduce copy/paste.
  // Yes, 'tis not the height of programming.
  let draw_hex_helper = function(v) {
    let tt = tile_types[v.type];
    let p = print_layout.hexToPixel(v.hex);

    doc.addImage(
        tt.img, 'PNG',
        _print_horiz_scale(p.x + draw_x_offset_cm),
        _print_vert_scale(p.y + draw_y_offset_cm),
        _print_horiz_scale(tile_width_in_cm),
        _print_vert_scale(tile_height_in_cm),
        v.type
    );
  };

  // Horizontal 10cm bar for checking calibration
  doc.setFontSize(10);
  const box = cfg.calibration_box_img;
  doc.addImage(
    box, 'PNG',
    2, 25.5,
    10, 0.1,
    "box"
  );
  doc.text(
    "This horizontal bar should be 100mm long.",
    3.5, 26,
  );

  // Vertical 10cm bar for calibration
  doc.addImage(
    box, 'PNG',
    18, 2,
    0.1, 10,
    "box"
  );
  doc.text(
    "This vertical bar should be 100mm long.",
    18.5, 10,
    {"angle": 90, "rotationDirection": 1}
  );

  // Now iterate over the map draw everything up to column 5 (by offset
  // coordinates, not axial/cube coordinates!) on the first page,
  // then add a page, iterate AGAIN and draw the rest.
  map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col >= 6)
        return;
      draw_hex_helper(v);
  });

  doc.addPage();
  draw_x_offset_cm = -10;
  map.iterate(function(v) {
      if (OffsetCoord.roffsetFromCube(1, v.hex).col < 6)
        return;
      draw_hex_helper(v);
  });

  doc.output('pdfobjectnewwindow', {filename: 'map.pdf'});
}

// The calibration PDF doesn't use the calibration rescaling (_print_(horiz/vert)_scale
// itself. That means in order to use this, you can always just print this calibration
// PDF, measure, and edit the scale factors at the top of this file to whatever you
// measured, without having to first reset the scale factors to 1.00.
export function generate_calibration_pdf(cfg) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'cm',
    format: 'a4',
  });

  // Draw 10cm length references for checking
  // on calibration for printing.
  const box = cfg.calibration_box_img;
  doc.setFontSize(10);

  // Horizontal 10cm bar for calibration
  doc.addImage(
    box, 'PNG',
    2, 14,
    10, 0.1,
    "box"
  );
  doc.text(
    "This horizontal bar should be 100mm long.",
    3.5, 14.5,
  );

  // Vertical 10cm bar for calibration
  doc.addImage(
    box, 'PNG',
    17, 2,
    0.1, 10,
    "box"
  );
  doc.text(
    "This vertical bar should be 100mm long.",
    17.5, 10,
    {"angle": 90, "rotationDirection": 1}
  );

  doc.text(
      "Use this calibration sheet as follows to get decent quality maps that align with the\n"
    + "regular KB maps:\n\n"
    + "1) Click 'Create Calibration PDF' and print the generated PDF onto A4 paper.\n"
    + "2) Measure the vertical and horizontal bars' lenghts. They should be exactly 10cm. If they\n"
    + "   are not exactly 10cm, then update the respective calibration factor number in js/pdf.js\n"
    + "   to match. For example, if the horizontal bar is 99mm instead of 100mm, then set\n"
    + "   printer_x_calibration_factor to 0.99 instead of the default 1.00.\n"
    + "3) Force-reload the KB Map page (eg. Ctrl-Shift-R in Chrome) to reload all assets.\n"
    + "4) Print the actal KB maps, now calibrated to the right physical dimensions.\n"
    + "5) Optionally also measure the bars on the map output. After calibration they should very much\n"
    + "   have a length of 10cm/100mm each. If not, despair. Then calibration doesn't seem to work.\n",
    2, 2
  );


  doc.output('pdfobjectnewwindow', {filename: 'calibration.pdf'});
}

