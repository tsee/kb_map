#!perl
use 5.14.1;
use warnings;
use feature 'signatures';

use lib 'lib';
use KBMap::Server;

KBMap::Server->new->run();

