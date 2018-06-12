Nginx is a lightweight, high-performance web server designed for the purpose of delivering large amounts of static content quickly and with efficient use of system resources. In contrast to the Apache server, nginx uses an asynchronous event-driven model which provides more predictable performance under load.

Install Nginx Web Server on Debian 8

{{< note >}} This guide is written for a non-root user. Commands that require elevated privileges are prefixed with sudo. If you're not familiar with the sudo command, you can check our Users and Groups guide. {{< /note >}}

Before You Begin
Ensure that you have followed the Getting Started and Securing Your Server guides, and the Linode's hostname is set.

To check your hostname run:

hostname
hostname -f
The first command should show the short hostname, and the second should show the fully qualified domain name (FQDN).

Update your system:

sudo apt-get update && sudo apt-get upgrade
Install nginx
From Debian Repositories
The simplest way to install nginx on a server is to download it from Debian's repositories.

Install nginx and start the daemon:

sudo apt-get install nginx
Installing nginx from the Debian repositories ensures that nginx has been tested and will optimally run on Debian. However, Debian repositories are often a few versions behind the latest nginx release.

Nginx can be tested by navigating to your FQDN in your browser. The default nginx page should be present.

From Nginx Package Repository
This method differs from the one above in that it installs from the official nginx repository rather than use the package provided by Debian. Follow these steps if you would like to install the latest stable version of nginx.

Create the /etc/apt/sources.list.d/nginx.list file, which instructs the package manager to download packages from the nginx repositories:

touch /etc/apt/sources.list.d/nginx.list
Add the following lines to the file:

{{< file "/etc/apt/sources.list.d/nginx.list" >}} deb http://nginx.org/packages/debian/ jessie nginx deb-src http://nginx.org/packages/debian/ jessie nginx

{{< /file >}}

Download the PGP key used to sign the packages in the nginx repository and import it into your keyring:

curl http://nginx.org/keys/nginx_signing.key | apt-key add -
Update your list of available packages:

apt-get update
Instruct the package manager to install the nginx package:

apt-get install nginx
From Source
The Debian project does not track the latest development of the nginx server. Consequently, nginx can be downloaded and installed from a source distribution if you require a newer version.

Install nginx dependencies:

sudo apt-get install libpcre3-dev build-essential libssl-dev
The source files and binaries will be downloaded to the /opt/ directory. Navigate to /opt/:

cd /opt/
Download the latest stable version of nginx, which can be found on its website. At the time of this publication, nginx 1.11.2 is the latest stable version:

sudo wget http://nginx.org/download/nginx-1.11.2.tar.gz
Extract the file, then navigate to the new directory:

sudo tar -zxvf nginx-1.*.tar.gz
cd /nginx-1.*
Configure the build options. You may also wish to install additional modules and specify additional settings in this step, depending on your needs:

sudo ./configure --prefix=/opt/nginx --user=nginx --group=nginx --with-http_ssl_module --with-ipv6
When this finishes running, it will output configuration information:

nginx path prefix: "/opt/nginx"
nginx binary file: "/opt/nginx/sbin/nginx"
nginx configuration prefix: "/opt/nginx/conf"
nginx configuration file: "/opt/nginx/conf/nginx.conf"
nginx pid file: "/opt/nginx/logs/nginx.pid"
nginx error log file: "/opt/nginx/logs/error.log"
nginx http access log file: "/opt/nginx/logs/access.log"
nginx http client request body temporary files: "client_body_temp"
nginx http proxy temporary files: "proxy_temp"
nginx http fastcgi temporary files: "fastcgi_temp"
nginx http uwsgi temporary files: "uwsgi_temp"
nginx http scgi temporary files: "scgi_temp"
Build and install nginx with the above configuration:

sudo make
sudo make install
Nginx is now installed in /opt/nginx.

As the root user, create a user and group for nginx:

sudo adduser --system --no-create-home --disabled-login --disabled-password --group nginx
Create a systemd service script to run nginx:

{{< file "/lib/systemd/system/nginx.service" shell >}} [Unit] Description=A high performance web server and a reverse proxy server After=network.target

[Service] Type=forking PIDFile=/opt/nginx/logs/nginx.pid ExecStartPre=/opt/nginx/sbin/nginx -t -q -g 'daemon on; master_process on;' ExecStart=/opt/nginx/sbin/nginx -g 'daemon on; master_process on;' ExecReload=/opt/nginx/sbin/nginx -g 'daemon on; master_process on;' -s reload ExecStop=-/sbin/start-stop-daemon --quiet --stop --retry QUIT/5 --pidfile /opt/nginx/logs/nginx.pid TimeoutStopSec=5 KillMode=mixed

[Install] WantedBy=multi-user.target

{{< /file >}}

{{< note >}}
This script assumes that you used the build configuration options specified in Step 5. If your script is not working correctly, be sure that the path in the line beginning with PIDFile matches your PID file, and the path in lines beginning with Exec match your binary file. These file paths can be found in the output when you configured your build options. {{< /note >}}

Change the ownership of the script:

sudo chmod +x /lib/systemd/system/nginx.service
Start nginx:

sudo systemctl start nginx
Optionally, you can enable it to start automatically on boot:

sudo systemctl enable nginx
Continue reading our introduction to Basic nginx Configuration for more helpful information about using and setting up a web server.