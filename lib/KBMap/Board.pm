use 5.14.1;
package KBMap::Board;
use warnings;
use feature 'signatures';
use Exporter 'import';

our %FieldTypes;
BEGIN {
  %FieldTypes = (
    F_NONE => 0, # still undefined tile
    F_CANYON => 1,
    F_DESERT => 2,
    F_FLOWERS => 3,
    F_FOREST => 4,
    F_GRASS => 5,
    F_WATER => 6,
    F_MOUNTAIN => 7,
    F_CASTLE => 8,
  );
}
use constant {
  %FieldTypes,
  WIDTH => 10,
  HEIGHT => 10,
};

our @EXPORT_OK = (
  keys(%FieldTypes),
);
our @EXPORT = @EXPORT_OK;

# a kb board is represented as an array of 100 tiles, arranged in a 10x10 row
# major matrix (first row one, then row two, ...) for display and rendering.
sub new ($class, %args) {
  my $self = bless {
    tiles => [],
  } => $class;

  $self->reset_board();

  return $self;
}

sub reset_board ($self) {
  @{ $self->{tiles} } = ( (F_NONE) x (WIDTH*HEIGHT) );
}

sub tiles ($self) {
  return $self->{tiles};
}

sub render_ascii ($self) {
  my @lines;
  foreach my $row (0..HEIGHT-1) {
    my $i = $row * WIDTH;
    my @row = @{ $self->tiles }[$i .. ($i+WIDTH-1)];
    push @lines, ($row % 2 == 1 ? " " : "" ) . join(" ", @row);
  }

  return \@lines;
}

1;
