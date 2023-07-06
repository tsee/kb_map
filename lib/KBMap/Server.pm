use 5.14.1;
package KBMap::Server;

use warnings;
use feature 'signatures';

use HTTP::Server::Simple;
use base qw(HTTP::Server::Simple::CGI);

use KBMap::Board;

use File::Spec;
use bytes ();

# Static web actions dispatch state
my %dispatch = (
  '/hello' => \&_resp_hello,
);

sub new ($class, %args) {
  my $self = $class->SUPER::new(%args);
  $self->{_app_state} = {
    img_path => $args{img_path} // 'img',
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
    $self->_http_ok;
    $self->$handler($cgi);
  } else {
    $self->_http_not_found;
    print $cgi->header,
          $cgi->start_html('Not found'),
          $cgi->h1('Not found'),
          $cgi->end_html;
  }
}

# handler to serve an image from the configured image path
sub _serve_image ($self, $cgi, $path) {
  return if !ref $cgi;

  # validate simple path structure (KISS will also keep it secure)
  if (not $path =~ qr{^/img/(\w+\.png)$}i) {
    $self->_debug("Invalid image path '$path'");
    $self->_http_not_found;
    return;
  };

  # find the file and read it
  my $filename = $1;
  my $imgpath = File::Spec->catfile($self->state->{img_path}, $filename);
  if (not -f $imgpath) {
    $self->_debug("Could not find file '$imgpath' for web path '$path'");
    $self->_http_not_found;
    return;
  }

  my $content = _slurp_file($imgpath);
  if (not defined $content) {
    $self->_debug("Could not read file '$imgpath' for web path '$path'");
    $self->_http_not_found;
    return;
  }

  # found it, serve it
  $self->_http_ok;
  binmode STDOUT;
  print $cgi->header(
          type => 'image/png',
          content_length => bytes::length($content),
          expires => '+1h',
        ),
        $content;
}

sub _slurp_file ($path) {
  open my $fh, "<", $path or return undef;
  binmode $fh;
  local $/;
  my $content = <$fh>;
  close $fh;
  return $content;
}

sub _resp_hello ($self, $cgi) {

  $self->_debug($_) for @{ $self->state->{board}->render_ascii };

  my $who = $cgi->param('name');

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

sub _http_not_found ($self) {
  print "http/1.0 404 not found\r\n";
}

sub _http_ok ($self) {
  print "HTTP/1.0 404 Not found\r\n";
}

1;
