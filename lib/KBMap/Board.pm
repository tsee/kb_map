use 5.14.1;
package KBMap::Board;
use warnings;
use feature 'signatures';
use Exporter 'import';
use JSON;

our %TileTypes;
our %ValidTileTypes;
BEGIN {
  %TileTypes = (
    F_NONE => "none", # still undefined tile
    F_CANYON => "canyon",
    F_DESERT => "desert",
    F_FLOWERS => "flowers",
    F_FOREST => "forest",
    F_GRASS => "grass",
    F_WATER => "water",
    F_MOUNTAIN => "mountain",
    F_CASTLE => "castle",
  );

  %ValidTileTypes = map {$_ => 1} values(%TileTypes);
}
use constant {
  %TileTypes,
  WIDTH => 10,
  HEIGHT => 10,
};

our @EXPORT_OK = (
  keys(%TileTypes),
);
our @EXPORT = @EXPORT_OK;

# a kb board is represented as an array of 100 tiles, arranged in a 10x10 row
# major matrix (first row one, then row two, ...) for display and rendering.
sub new($class, %args) {
  my $self = bless {
    tiles => [],
  } => $class;

  $self->reset_board();

  return $self;
}

sub reset_board($self) {
  @{ $self->{tiles} } = ( (F_NONE) x (WIDTH*HEIGHT) );
}

sub tiles($self) {
  return $self->{tiles};
}

sub set_tile($self, $col, $row, $type) {
  $self->{tiles}[$row * WIDTH + $col] = $type;
}

sub render_ascii($self) {
  my @lines;
  foreach my $row (0..HEIGHT-1) {
    my $i = $row * WIDTH;
    my @row = @{ $self->tiles }[$i .. ($i+WIDTH-1)];
    push @lines, ($row % 2 == 1 ? " " : "" ) . join(" ", @row);
  }

  return \@lines;
}

sub render_json($self) {
  return encode_json({ tiles => $self->{tiles} });
}

sub is_valid_tile_type($self, $type) {
  return if not defined $type;
  return $ValidTileTypes{$type};
}

sub all_valid_tile_types($self, @types) {
  foreach my $type (@types) {
    return if not defined $type;
    return if not $ValidTileTypes{$type};
  }
  return 1;
}

1;
