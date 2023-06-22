---
layout: post
title: 使用 rync 同步本地和远程的目录
tags: rsync
excerpt_separator: <!-- more -->
---

如果你有一个 *超大* 的文件夹需要频繁在本地和远程同步，简单的 scp 由于每次是全量复制，会导致产生很多无用功。

增量同步工具 rsync 登场~ 🔫

<!-- more -->

[原文链接](https://www.digitalocean.com/community/tutorials/how-to-use-rsync-to-sync-local-and-remote-directories-on-a-vps)

## 介绍
	
Rsync 含义是 "Remote Sync", 是 linux 下用来同步远程和本地目录工具。
它使用特殊的算法，来计算由于变化而需要复制的数据，使传输数据量最小化，即通过算法实现文件的增量同步。

在这篇文章中，我们将介绍这强大工具的基本使用。
我们使用 Ubuntu 12.04 vps，但是你可以在任何 linux 发行版上执行命令。

## 什么是 rsync

rsync 是一款非常灵活的基于网络同步工具。它同样可以指代工具内部使用的 rsync 网络协议。

约定: 当我们在文章中说到 rsync 时，我们指的是工具而非协议。

由于它在 Linux 和类 Unix 系统上无处不在，并且作为系统脚本工具的流行，大多数 Linux 发行版默认包含它。

## 基本使用

rsync 的基本语法非常直接，就像是在使用 ssh, scp, cp.

我们先创建两个目录和若干测试文件:

```shell
cd ~
mkdir dir1
mkdir dir2
touch dir1/file{1..100}
```

现在我们有一个名为 `dir1` 的目录，它包含了 100 个空文件:
```shell
> ls dir1
file1    file18  file27  file36  file45  file54  file63  file72  file81  file90
file10   file19  file28  file37  file46  file55  file64  file73  file82  file91
file100  file2   file29  file38  file47  file56  file65  file74  file83  file92
file11   file20  file3   file39  file48  file57  file66  file75  file84  file93
file12   file21  file30  file4   file49  file58  file67  file76  file85  file94
file13   file22  file31  file40  file5   file59  file68  file77  file86  file95
file14   file23  file32  file41  file50  file6   file69  file78  file87  file96
file15   file24  file33  file42  file51  file60  file7   file79  file88  file97
file16   file25  file34  file43  file52  file61  file70  file8   file89  file98
file17   file26  file35  file44  file53  file62  file71  file80  file9   file99
```

我们还创建了一个 `dir2` 的空目录。
在本地系统上，将 `dir1` 的内容同步到 `dir2`, 可以用:

```shell
> rsync -r dir1/ dir2
```

`-r` 选项代表递归 (recursive)， 在同步目录时一定要带上。也可以附上 `-a` 选项: 

```shell
> rsync -a dir1/ dir2
```

`-a` 是一个复合选项，a 代表 archive, 递归同步，并且保留链接, 特殊设备文件, 修改时间, 用户组，文件所属用户，权限.
比起 `-r` , `-a` 的使用频率更高。

## 注意

你也许已经注意到第一个参数末尾带上了斜杠(/)

```shell
> rsync -a dir1/ dir2
```

这个斜杠代表 `dir1` 下的所有内容，不可省略。

如果不小心忘记了斜杠，rsync 将 `dir1` 连同内容放到 `dir2` 下，`dir2` 的目录结构将会变成: 

```shell
~/dir2/dir1/[files]
```

在执行 rsync 命令之前，一定别忘记再检查一遍你的命令。

rsync 提供一种检查命令的方式: -n 或 --dry-run 选项。 -v (verbose) 选项会打印详细输出。

```shell
> rsync -anv dir1/ dir2

sending incremental file list
./
file1
file10
file100
file11
file12
file13
file14
file15
file16
file17
file18
...
```

对比一下我们去掉斜杠后 rsync 的操作有何不同:

```shell
> rsync -anv dir1 dir2
sending incremental file list
dir1/
dir1/file1
dir1/file10
dir1/file100
dir1/file11
dir1/file12
dir1/file13
dir1/file14
dir1/file15
dir1/file16
dir1/file17
dir1/file18
...
```

你可以看到目录本身也被传输了。

## 如何用 rsync 在本地和远程的系统间实现同步

如果你能 ssh 到远程机器，并且在本地和远程同时安装了 rsync, 那么进行同步非常简单。如果你需要设置 ssh keys 可以参考 [这篇文章](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-2)。

一旦配置好了两台机器的 ssh ，你可以按如下命令将刚才的 `dir1` 同步到远程机器上 (注意我现在想要传输整个目录，所以我忽略了末尾的斜杠): 

```shell
> rsync -a ~/dir1 username@remote_host:destination_directory
```

这也可以称为 *推送(push)* 操作，因为我把本地的一个目录推送到了远程机器上。

相反的操作成为拉取(pull)。意味着将远程机器的目录同步到本地。如果 `dir1` 在远程机器，语法会是这样:

```shell
> rsync -a username@remote_host:/home/username/place_to_sync_on_local_machine
```

就像 `cp` 一样，源文件永远位于第一个参数，目的文件在第二位。

## rsync 的重要选项

rsync 为修改默认行为提供了丰富的选项。我们之前已经讨论过了一部分。

如果你想传输的文件是未被压缩过的文本文件，你可以通过 -z 压缩选项来减少网络传输:

```shell
> rsync -az source destination
```

`-P` 标记非常有用，它是 `--progress` 和 `--partial` 的结合。`--progress` 将会为你呈现传输进度条，`--partial` 允许你继续被中断的传输。

```shell
> rsync -azP source destination
sending incremental file list
./
file1
						0 100%    0.00kB/s    0:00:00 (xfer#1, to-check=99/101)
file10
						0 100%    0.00kB/s    0:00:00 (xfer#2, to-check=98/101)
file100
						0 100%    0.00kB/s    0:00:00 (xfer#3, to-check=97/101)
file11
						0 100%    0.00kB/s    0:00:00 (xfer#4, to-check=96/101)
...
```

如果你再次运行该命令，你会看到更简短的输出，因为 rsync 已经判断出文件没有修改发生，无需传输。

为了说明 rsync 可以通过文件修改时间来决定它们是否发生了变化:

```shell
> rsync -azP source destination
sending incremental file list

sent 818 bytes received 12 bytes 1660.00 bytes/sec
total size is 0 speedup is 0.00
```

我们可以更新几个文件的修改时间来查看 rsync 时如何智能地只传输变化的文件:

```shell
> touch dir1/file{1..10}
> rsync -azP source destination
sending incremental file list
file1
						0 100%    0.00kB/s    0:00:00 (xfer#1, to-check=99/101)
file10
						0 100%    0.00kB/s    0:00:00 (xfer#2, to-check=98/101)
file2
						0 100%    0.00kB/s    0:00:00 (xfer#3, to-check=87/101)
file3
						0 100%    0.00kB/s    0:00:00 (xfer#4, to-check=76/101)
...
```

为了让两个目录保持绝对同步，对于已经在源目录中被删除的文件，在目标目录里，有必要也删掉它们。
默认情况下，rsync 不会从目标目录中删除任何文件。

我们可以通过增加 `--delete` 标记来修改这一行为，推荐使用 `--dry-run` 来测试命令以防止数据丢失。

```shell
> rsync -a `--delete` source destination
```

如果你想在同步时，从从源目录排除部分文件或者目录，可以在 `--exclude=` 选项后用一个逗号分隔的列表来指定它们:

```shell
> rsync -a --exclude=pattern_to_exclude source destination
```

推荐 --exclude 升级版: --exclude-file 可以将 pattern 记录在文件中, 通常 gitignore 的匹配规则同样适用 rsync 的 exclude。

如果我们已经在命令上制定了排除(exclude)的参数，仍可以通过制定包含(include)参数来强制同步:

```shell
> rsync -a --exclude=pattern_to_exclude --include=pattern_to_include source destination
```

## 小结

rsync 通过网络进行文件同步，简单、强大、灵活使它成为文件级别同步工具的不二之选。

掌握 rsync 可让您设计复杂的备份操作并获得对传输内容和传输方式的细粒度控制。

`<<<EOF`
