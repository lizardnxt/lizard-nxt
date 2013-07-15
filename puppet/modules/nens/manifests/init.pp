class nens {

Exec { path => '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' }

# Global variables 
$tz = 'Europe/Amsterdam' # Timezone
$user = 'buildout' # User to create
$password = 'buildout' # The user's password
$db_name = 'lizard' # PostgreSQL database name to create
$db_user = 'buildout' # PostgreSQL username
$db_password = 'buildout' # PostgreSQL password 

include user
include buildoutdir
include buildoutcfg
include apt
include timezone

include ubuntugis
include buildtools
include python
include python_packages_build_deps
include python_packages_not_buildout_compatible
include numpy_system_wide
include gdal
include postgis
include create_db
include memcached
include rabbitmq
include software

class user {
  exec { 'add user':
    command => "sudo useradd -m -G sudo -s /bin/bash ${nens::user} && echo \"${nens::user}:${nens::password}\" | sudo chpasswd",
    unless => "id -u ${nens::user}"
  }
}

class buildoutdir {
  # Prepare user's project directories
  file {[
      "/home/${nens::user}/.buildout",
      "/home/${nens::user}/.buildout/eggs",
      "/home/${nens::user}/.buildout/downloads",
      "/home/${nens::user}/.buildout/extends",
    ]:
    ensure => directory,
    owner => "${nens::user}",
    group => "${nens::user}",
    require => Class['user']
  }
}

class buildoutcfg {
  file { 'buildout default config':
    path => "/home/${nens::user}/.buildout/default.cfg",
    ensure => present,
    owner => "${nens::user}",
    group => "${nens::user}",
    mode => 0755,
    content => template("nens/default.cfg.erb"),
    require => [
        Class['buildoutdir'],
    ]
  }
}

class apt {
  exec { 'apt-get-update': 
    command => 'sudo apt-get update'
  }
  
  package { 'python-software-properties':
    ensure => latest,
    require => Exec['apt-get-update']
  }
}

class timezone {
  package { "tzdata":
    ensure => latest,
    require => Class['apt']
  }
  
  file { "/etc/localtime":
    require => Package["tzdata"],
    source => "file:///usr/share/zoneinfo/${nens::tz}",
  }
}

# For GDAL & Postgis
class ubuntugis {
  exec { 'ubuntugis ppa':
    command => 'sudo add-apt-repository ppa:ubuntugis/ppa && sudo apt-get update',
    unless => 'test -f /etc/apt/sources.list.d/ubuntugis-ppa-precise.list',
    require => Package['python-software-properties']
  }
}

class buildtools {
  package { ['unzip', 'git', 'build-essential', 'subversion', 'mercurial', 'curl']:
    ensure => latest,
    require => Class['apt']
  }
}

class python {
  package { ['python', 'python-dev', 'python-pip']:
    ensure => latest,
    require => Class['apt']
  }
}

class python_packages_build_deps {
    # psycopg2
    if !defined(Package['libpq-dev'])         { package {'libpq-dev': ensure => latest, require => Class['apt'] }}

    # Spatialite
    if !defined(Package['libgeos-c1'])        { package {'libgeos-c1': ensure => latest, require => Class['apt'] }}

    # Pillow
    if !defined(Package['zlib1g-dev'])        { package {'zlib1g-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['libpng12-dev'])      { package {'libpng12-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['libjpeg-dev'])       { package {'libjpeg-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['libfreetype6-dev'])  { package {'libfreetype6-dev': ensure => latest, require => Class['apt'] }}

    # numpy
    if !defined(Package['libatlas-base-dev']) { package {'libatlas-base-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['liblapack-dev'])     { package {'liblapack-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['gfortran'])          { package {'gfortran': ensure => latest, require => Class['apt'] }}

    # matplotlib
    if !defined(Package['zlib1g-dev'])        { package {'zlib1g-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['libpng12-dev'])      { package {'libpng12-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['libfreetype6-dev'])  { package {'libfreetype6-dev': ensure => latest, require => Class['apt'] }}

    # Scipy
    if !defined(Package['libatlas-base-dev']) { package {'libatlas-base-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['liblapack-dev'])     { package {'liblapack-dev': ensure => latest, require => Class['apt'] }}
    if !defined(Package['gfortran'])          { package {'gfortran': ensure => latest, require => Class['apt'] }}
    if !defined(Package['g++'])               { package {'g++': ensure => latest, require => Class['apt'] }}
}

# Exceptions for:
# * pyproj: memory corruption when built manually
# * mapnik2: doesn't have a PyPI entry
class python_packages_not_buildout_compatible {
  # pyproj
  package { ['proj-data', 'python-pyproj']:
    ensure => latest,
    require => Class['apt']
  }

  # mapnik2
  package { ['python-mapnik2']:
    ensure => latest,
    require => Class['apt']
  }
}

# Exception for numpy: due to incompatibility with buildout,
# some packages need the newest numpy installed system-wide
class numpy_system_wide {
#  notice('Compiling and installing numpy, this might take a while!')
  package { 'numpy':
    ensure => latest,
    provider => pip,
    require => Class['python']
  }
}

# GDAL executables have more to offer than the Python bindings.
class gdal {
  package { ['gdal-bin', 'libgdal-dev']: # from ubuntugis-ppa
    ensure => latest,
    require => [
        Exec['ubuntugis ppa'],
    ]
  }
}

class postgis {
  package { ['postgis']: # from ubuntugis-ppa
    ensure => latest,
    require => [
        Exec['ubuntugis ppa'],
    ]
  }
}

class create_db {
  postgisdatabase{ $nens::db_name:
    owner => $nens::db_user,
    password => $nens::db_password,
    require => Class['postgis']
  }
}

class memcached {
  package { 'memcached':
    ensure => latest,
    require => Class['apt']
  }
}

class rabbitmq {
  package { 'rabbitmq-server':
    ensure => latest,
    require => Class['apt']
  }
}

class software {
  package { ['vim', 'htop']:
    ensure => latest,
    require => Class['apt']
  }
}

define postgisdatabase($owner = myuser, $password = mypassword) {

  # import template creation script
  file {"/usr/local/bin/make-postgresql-postgis-template.sh":
    ensure => present,
    owner  => root,
    group  => root,
    mode   => 755,
    source => "puppet:///modules/nens/usr/local/bin/make-postgresql-postgis-template.sh",
  }

  # create template_postgis
  exec {"create template_postgis":
    command => "/usr/local/bin/make-postgresql-postgis-template.sh",
    unless  => "psql -l | grep template_postgis",
    user    => postgres,
    require => [
      Package["postgis"],
      File["/usr/local/bin/make-postgresql-postgis-template.sh"],
    ]
  }

  exec { "postgres create user":
    command => "createuser ${owner} -R -D -S && psql -c \"alter user ${owner} with password '${password}';\"",
    unless  => "psql -c 'select * from pg_roles;' | grep '\\b${owner}\\b'",
    user => postgres,
  }
  
  exec { "postgis create database":
    command => "createdb ${name} --owner ${owner} --template template_postgis",
    unless  => "psql -l | grep '\\b${name}\\b'",
    user => postgres,

    require => [
      Exec["postgres create user"], 
      Exec["create template_postgis"],
    ],
  }
}

}
