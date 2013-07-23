lizard-nxt
==========

TL,DR;
------

This repository contains a Django project which aims to be the base of Lizard-NXT.



Lizard-NXT
----------

Lizard-NXT is a platform for water data and information.
Based on years of experience building Python solutions for individual customers, Lizard-NXT aims to combine this knowledge into one suite.


Features
--------

 - One 'site', many accounts (organizations, users)
 - Users and organizations can 'brand' their account and point their own domains to it
 - Role-based permission system
 - HTTP API's for everything
 - Search for everything
 - Internationalized
 - Built on PostGIS


Installation
------------

 1. Install [Vagrant](http://www.vagrantup.com/) for your platform. (Tip: Check Aptitude if your host OS is Ubuntu)
 2. Clone this repository somewhere on your filesystem
 3. You'll see a Vagrantfile in the cloned repo. Have a look at it. On OSX, you might want to uncomment a certain line for NFS or on Ubuntu for an exotic symlink fix. 
 4. *IMPORTANT* If you edit the Vagrantfile, make sure you 'git update-index --assume-unchanged Vagrantfile'
 5. cd into the repo, execute 'vagrant up'
 6. Have patience... the previous step will provision a fresh Ubuntu Precise installation with the packages you need and will configure PostGIS for you
 7. When it says it's done, execute 'vagrant ssh' to access the new Virtual Machine
 8. Inside the VM, execute 'cd /vagrant' to go to the directory that's shared between the VM (you're 'inside' it) and the host OS
 9. Go to /vagrant/lizardnxt/
 10. Install 'virtualenv' by running the command 'sudo pip install virtualenv'
 11. Create a virtual environment (Python separation library): 'virtualenv .' (do not forget the '.')
 12. This creates a lib/, local/, bin/ and include/ directory
 13. Activate the virtualenv: '. bin/activate'
 14. Now cd into the lizardnxt/lizardnxt directory (where settings.py and requirements.pip are located)
 15. Execute 'pip install -r requirements.pip' (which will install the packages on which the project depends)
 16. .....
 



