use 5.14.1;
package KBMap::Server;

use warnings;
use feature 'signatures';

use HTTP::Server::Simple;
use base qw(HTTP::Server::Simple::CGI);

use KBMap::Board;

use File::Spec;
use bytes ();

use constant {
  CANVAS_FILE => 'canvas.html',
};

# Static web actions dispatch state
my %dispatch = (
  '/'          => \&_resp_canvas,
  '/board'     => \&_resp_board,
  '/board_set' => \&_resp_board_set,
  '/hello'     => \&_resp_hello,
);

sub new ($class, %args) {
  my $self = $class->SUPER::new(%args);
  $self->{_app_state} = {
    img_path => $args{img_path} // 'img',
    static_path => $args{static_path} // 'static',
    board => KBMap::Board->new,
  };
  return $self;
}

sub state ($self) {
  return $self->{_app_state};
}

# Central handler that dispatches to individual actions
sub handle_request ($self, $cgi) {
  my $path = $cgi->path_info();
  $self->_debug($path);

  # handle image serving special case that covers an entire sub path
  if ($cgi->request_method eq "GET" and $path =~ qr{^/img/}) {
    $self->_serve_image($cgi, $path);
    return;
  }

  my $handler = $dispatch{$path};

  if (ref($handler) eq "CODE") {
    $self->$handler($cgi);
  } else {
    $self->_http_not_found;
    print $cgi->header,
          $cgi->start_html('Not found'),
          $cgi->h1('Not found'),
          $cgi->end_html;
  }
}

sub _resp_canvas($self, $cgi) {
  return if !ref $cgi;

  my $local_path = File::Spec->catfile($self->state->{static_path}, CANVAS_FILE);

  return $self->_serve_static(
    $cgi,
    $local_path,
    -type => 'text/html',
  );
}

sub _resp_board($self, $cgi) {
  return if !ref $cgi;

  print "HTTP/1.1 200\r\n";
  print $cgi->header(
    -status => '200 OK',
    -type => 'text/json',
  );
  print $self->{_app_state}{board}->render_json;
}

sub _resp_board_set($self, $cgi) {
  return if !ref $cgi;

  my $row = $cgi->param('row');
  my $col = $cgi->param('col');
  my $type = $cgi->param('type');

  if (not $self->{_app_state}{board}->is_valid_tile_type($type)) {
    $self->_http_bad_request("Invalid tile type '$type'");
    return;
  }

  $self->{_app_state}{board}->set_tile($col, $row, $type);
  print "HTTP/1.1 200\r\n";
  print $cgi->header(
    -status => '200 OK',
  );
}


# handler to serve an image from the configured image path
sub _serve_image($self, $cgi, $path) {
  return if !ref $cgi;

  # validate simple path structure (KISS will also keep it secure)
  if (not $path =~ qr{^/img/([\w+_-]+\.png)$}i) {
    $self->_debug("Invalid image path '$path'");
    $self->_http_not_found;
    return;
  };

  my $filename = $1;
  my $local_path = File::Spec->catfile($self->state->{img_path}, $filename);

  return $self->_serve_static(
    $cgi,
    $local_path,
    -type => 'image/png',
  );
}

sub _serve_static($self, $cgi, $local_path, %headers) {
  # find the file and read it
  if (not -f $local_path) {
    $self->_debug("Could not find file '$local_path' for web path '".$cgi->path_info()."'");
    $self->_http_not_found;
    return;
  }

  my $content = _slurp_file($local_path);
  if (not defined $content) {
    $self->_debug("Could not read file '$local_path' for web path '".$cgi->path_info()."'");
    $self->_http_not_found;
    return;
  }

  # found it, serve it
  %headers = (
      %headers,
      -content_length => bytes::length($content),
      -status => 200,
  );
  print "HTTP/1.1 200\r\n";
  print $cgi->header(%headers);
  binmode STDOUT;
  print $content;
  return 1;
}

# Would be better to read/write chunked, but these are small files, I'm lazy, and
# to be perfectly frank, I bet there's full buffering somewhere in the simple web
# server code anyway.
sub _slurp_file ($path) {
  open my $fh, "<", $path or return undef;
  binmode $fh;
  local $/;
  my $content = <$fh>;
  close $fh;
  return $content;
}

# debug action
sub _resp_hello ($self, $cgi) {

  $self->_debug($_) for @{ $self->state->{board}->render_ascii };

  my $who = $cgi->param('name');

  print "HTTP/1.1 200\r\n";
  print $cgi->header,
        $cgi->start_html("Hello"),
        $cgi->h1("Hello $who!"),
        $cgi->end_html;
}

# utility methods

# debug log a message
sub _debug ($server, @msgs) {
  my $time = time();
  foreach (@msgs) {
    chomp;
    print STDERR "[$time] $_\n";
  }
}

sub _http_not_found($self) {
  print "HTTP/1.1 404 Not found\r\n";
}

sub _http_bad_request($self, $msg) {
  print "HTTP/1.1 400 $msg\r\n";
}

sub _http_ok($self) {
  print "HTTP/1.1 200 OK\r\n";
}

1;

