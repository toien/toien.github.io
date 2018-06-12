# Install Debian 8.5 (Jessie) On VMWare Player 

edit /etc/apt/sources.list

apt update  # this will update package list so let you install latest package

su to root

1. apt install sudo, config it
1. config sshd
1. install vim-nox


After Debian StartUp
Install VMWare Tools
1. On Guest system, install gcc, build-essential, 
2. Searching for a valid kernel header path
    sudo apt install linux-headers-$(uname -r)


The disable didn't work because the Debian /etc/X11/default-display-manager logic is winding up overriding it.

In order to make text boot the default under systemd (regardless of which distro, really):

systemctl set-default multi-user.target
To change back to booting to the GUI,

systemctl set-default graphical.target
I confirmed those work on my Jessie VM.

PS: You don't actually need the X server on your machine to run X clients over ssh. The X server is only needed where the display (monitor) is.


python-dev
python3-dev