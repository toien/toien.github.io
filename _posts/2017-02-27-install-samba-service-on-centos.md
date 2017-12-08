---
layout: post
title: 在 Centos 上配置 Samba 服务
excerpt_separator: <!-- more -->
---

如何在 Centos 上快速安装，配置 Samba 服务，启用匿名模式以快速使用。
<!-- more -->

本机环境: CentOS Linux release 7.3.1611 (Core)

检查你的环境是否和我一样

    [root@localhost ~]# cat /etc/centos-release
    CentOS Linux release 7.3.1611 (Core)

### 1. 更新 yum 软件仓库

    > yum check-update

### 2. 安装 samba 

    > yum install samba

### 3. 配置 samba，修改配置文件

    > vim /etc/samba/smb.conf

    # See smb.conf.example for a more detailed config file or
    # read the smb.conf manpage.
    # Run 'testparm' to verify the config is correct after
    # you modified it.

    [global]  # 全局设置标签
        workgroup = SAMBA
        server string = Gaoq.com
        netbios name =  GaoqSamba

        log file = /var/log/samba/log.%m
        security = user
        guest ok = yes                    # 是否启用来宾用户
        map to guest = Bad Password

    [public]  # 公共设置标签
        comment = Public dir
        path = /var/share       # 对应 server 上的路径
        public = yes            # 
        available = yes         # 是否开放
        browsable = yes         # 用户权限，可读
        writable = yes          # 用户权限，可写
        force user = root       # 配置和真实路径相同的 owner 
        create mask = 0777      # 创建文件时默认的权限 
        directory mask = 0777   # 创建路径时默认的权限 

### 4. 配置 centos 自动启动服务
    
    > systemctl enable smb
    
### 5. 检查配置是否成功

    > systemctl is-enabled smb

### 6. 通过 windows explorer 访问
    
![](/public/img/posts/windows-explorer-access-samba.png)

`<<<EOF`