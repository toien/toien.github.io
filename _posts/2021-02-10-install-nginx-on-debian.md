---
layout: post
title: Install Nginx from source on Debian (stretch)
tags: nginx ops
excerpt_separator: <!-- more -->
---

I am not a professional Ops, i don't usually install softwares on server, every time i doing this, i always spent time googling to resolve issues during installation, which becomes some tedious to me.

In this post i will install nginx from source on debian. Trying to make installation portable, so i could copy executable nginx program to any another linux server, starting nginx instantly.

Taking this post as a memo, next time, start Nginx quickly!

<!-- more -->

I am using Debian 9(stretch), the linux server is an Aliyun ECS instance and Nginx version is 1.18.0.

## OpenSSL

Before install nginx, install openssl first.

SSL/TLS is common component for a lot of services like nginx. While linux usually contains openssl already, it's useful to install openssl from source if os built-in version can not met your need. and you should isolate two versions, use any of them freely.

1. download source tarball file from https://www.openssl.org/source/

2. tar xzf openssl-1.1.1i.tar.gz

3. config before compile start, you can read *INSTALL* file for more details

   `./config --prefix=${OPENSSL_DIR} --openssldir=${OPENSSL_DIR}`

   for me, i use a folder named `openssl-1.1.1i-build` and specified both config params. [since this](https://wiki.openssl.org/index.php/Compilation_and_Installation#PREFIX_and_OPENSSLDIR)

4. run compile / test / install 

   ```
   make 

   make test

   make install
   ```

Check openssl installed succussful

```
> ${OPENSSL_DIR}/bin/openssl version
OpenSSL 1.1.1i  8 Dec 2020
```

if you met issue when executing `bin/openssl`:

```
bin/openssl: /usr/lib/x86_64-linux-gnu/libssl.so.1.1: version 'OPENSSL_1_1_1' not found (required by bin/openssl)
bin/openssl: /usr/lib/x86_64-linux-gnu/libcrypto.so.1.1: version 'OPENSSL_1_1_1' not found (required by bin/openssl)
```

you need to set env, details can be found [here](https://github.com/openssl/openssl/issues/5845)

```
> export LD_LIBRARY_PATH=${OPENSSL_DIR}/lib
```

## Nginx

Nginx requires zlib and pcre. zlib is for content compression, and pcre is for url matches as reverse proxy.

### Zlib

1. download zlib source tarball from [](https://zlib.net/ )
2. unzip it with `tar zxf zlib-1.2.11.tar.gz`

### Pcre

1. download pcre from [](https://www.pcre.org/), use legacy version pcre not pcre2 or pcre3. i use *pcre-8.44.tar.gz* this one.
2. unzip it with `tar zxf pcre-8.44.tar.gz`

### Nginx

Finally let's deal with nginx.

1. download source tarball from https://nginx.org/en/download.html, for me it is: nginx-1.18.0
2. unzip it 
3. configure / compile / install
   ```
   > ./configure \
   --prefix=/opt/nginx-1.18.0-build \
   --conf-path=/etc/nginx/nginx.conf \
   --http-log-path=/var/log/nginx/access.log \
   --error-log-path=/var/log/nginx/error.log \
   --with-debug \
   --with-stream \
   --with-stream_ssl_module \
   --with-http_realip_module \
   --with-http_dav_module \
   --with-http_gzip_static_module \
   --with-threads \
   --with-pcre=/opt/pcre-8.44 \  # this is the source dir of pcre
   --with-pcre-jit \
   --with-zlib=/opt/zlib-1.2.11 \    # this is the source dir of zlib
   --with-http_v2_module \
   --with-http_ssl_module \
   --with-openssl=/opt/openssl-1.1.1i    # this is the source dir of openssl 

   > make

   > make install 
   ```

Finally check nginx is installed successfully:

```
> sbin/nginx -V
nginx version: nginx/1.18.0
built by gcc 6.3.0 20170516 (Debian 6.3.0-18+deb9u1)
built with OpenSSL 1.1.1i  8 Dec 2020
TLS SNI support enabled
```

After your nginx has been running for a period of time, you may want to add additional modules on it.

1. First, rerun ./configure and add --with-your-extra-module on it
2. Run make command to rebuild nginx 
3. Do **not** run `make install` which will overwrite config files, instead copy the executable nginx file form `objs` dir, place it overwrite previous one(make sure stop running Nginx first).

### Access log

Nginx access log is where you can see all requests from outside of world. if your website has *real* traffic, you'd better take care of nginx access log files.

Config nginx log format properly, and use file slice policy make sure log file is not going to be too big to deal with.

i recommend logrorate to do that:

```
/var/log/nginx/*.log {
  daily
  missingok
  rotate 52
  compress
  delaycompress
  notifempty
  create 640 nginx adm
  sharedscripts
  postrotate
    if [ -f /opt/nginx-1.18.0-build/logs/nginx.pid ]; then
      kill -USR1 `cat /opt/nginx-1.18.0-build/logs/nginx.pid`
    fi
  endscript
}
```

As you see, logrotate will truncate current log file and notify nginx to reload new log file.

`<<<EOF`