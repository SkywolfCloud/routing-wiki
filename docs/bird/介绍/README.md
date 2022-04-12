---
title: 介绍
lang: zh-CN
description: 关于bird的介绍
---

# 介绍

## 什么是bird?

> **BIRD**项目旨在开发一个功能齐全的动态 IP 路由守护程序，主要针对（但不限于）Linux、FreeBSD 和其他类 UNIX系统，并在[GNU 通用公共许可证](http://www.gnu.org/copyleft/copyleft.html)下分发。
>
> 目前它由[CZ.NIC Labs](http://labs.nic.cz/)开发和支持。目前**BIRD**团队成员有：
>
> - [Ondřej Filip](http://feela.network.cz/)（OSPF、BSD 端口、发布、打包）
> - [Martin Mareš](http://mj.ucw.cz/)（整体架构、核心、转储、BGP）
> - [Ondřej Zajíček](http://artax.karlin.mff.cuni.cz/~zajio1am/)（新的 BGP 功能、OSPFv3、BFD）
> - [Maria Matějka](http://mq.ucw.cz/)（MPLS、过滤器、多线程）
>
> 
>
> 前**BIRD**团队成员是 [Libor Forst](http://www.ms.mff.cuni.cz/~forst/)和 [Pavel Machek](http://atrey.karlin.mff.cuni.cz/~pavel/)。

如上所写，bird是一个在*nix和FreeBSD平台运行的大部分由C实现的路由程序，支持包括但不限于BGP、RIP、OSPF、Babel等协议。同类产品还有OpenBGPD, FRRouting等。

## 版本变迁

Bird目前有三个大版本：v1, v2, v3

### v1

Bird v1 是最早的Bird，由两个Daemon分别支持IPv4与IPv6的路由，最晚版本是1.6.8，于2019年9月11日发布。

目前而言我们不推荐使用此版本。

### v2

Bird v2是目前Bird的主线版本。与v1相比，v2仅使用一个Daemon来运行v4与v6的路由。最新版本是2.0.9，于2022年3月2日发布。

本Wiki将主要讲述该版本的使用。

### v3

Bird v3是Bird的下一代版本，该版本增加了多线程的支持。目前的最新版本为3.0-alpha0，于2022年2月7日发布。

目前v3还处在alpha阶段，我们欢迎有时间的用户去测试这个版本，并给作者提出建议。



