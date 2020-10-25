---
layout: post
title:  "第一次尝试超频内存 (G.Skill Trident Z Neo)"
date:   2019-10-22
categories: blog
---

##### Last updated on May 9, 2020 

<div id="google_translate_element"></div>

<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'zh'}, 'google_translate_element');
}
</script>

<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<br>

<img src="https://user-images.githubusercontent.com/14539571/69909944-dd3e1e00-13b7-11ea-8ff4-0126c70d193d.jpg" alt="RGB点亮" width="500"/>

DDR4的价格已经降到了历史最低点，且没有任何反弹的趋势。[据市场预测](https://www.gartner.com/en/newsroom/press-releases/2019-07-22-gartner-says-worldwide-semiconductor-revenue-to-decline-9point6-percent-in-2019)，DRAM供大于求的现状会持续到2020年二季度。虽然半导体公司在亏钱，但对于PC爱好者来说，这是再好不过的消息了。

下图是我本月早些时候在Newegg上购买的两条G.SKILL Trident Z Neo，型号[F4-3600C16D-32GTZNC](https://www.gskill.com/product/165/326/1562840211/F4-3600C16D-32GTZNC)，有效速度3600MT/s，时序16-19-19-39，电压1.35V。本文讲述的是我在X570平台上内存超频的经历。

<img src="https://user-images.githubusercontent.com/14539571/69909946-e0390e80-13b7-11ea-85a7-0f5ef7a87f94.jpg" alt="包装" width="500"/>

### 第一步：最大化FClk
[**Infinity Fabric**](https://en.wikichip.org/wiki/amd/infinity_fabric)是AMD平台上促进和控制组件之间数据传输的互连架构。Infinity **F**abric的频率参数在X570平台上通称为**FClk**（**F**-Clock）。

根据AMD在Computex上展示的幻灯片（下图），Ryzen 3000系列CPU的内存频率甜点为3733MT/s，此时FClk = 1867MHz，MemClk : FClk = 1:1；超过3733MT/s后，MemClk : FClk = 2:1，同时内存延迟明显提升。

<img src="https://user-images.githubusercontent.com/14539571/69909854-59cffd00-13b6-11ea-8a08-19af01203583.jpg" alt="内存频率甜点" width="650"/>

因此，为了不损失性能，MemClk : FClk = 1:1应该是Ryzen 3000系列最理想的设置。

虽说“甜点”是3733MT/s，但不是每一颗Ryzen 3000系列CPU都能跑这个参数。如果silicon lottery的运气实在不好，试试将BIOS中的CLDO_**VDDG**电压参数逐渐调高，直到接近SoC电压（默认1.1V）。

### 第二步：确认颗粒
不论内存条的RGB有多亮，也不论是什么品牌（Corsair、Crucial、G.Skill或是Team Group），全球只有三家主要内存元件制造商：**美光** (Micron)、**SK海力士** (SK Hynix)和**三星** (Samsung)。确认内存制造商和颗粒（die）后可以很大程度上预测内存条的超频能力范围。

通过软件[Thaiphoon Burner](http://www.softnology.biz/)查看SPD固件信息......得到了错误的信息：

<table border="0" cellpadding="0" cellspacing="0" width="230" align="left"><tbody><tr><th><b>DRAM COMPONENTS</b></th></tr><tr><td class="parnm" bgcolor="#E6E6E6">Manufacturer</td></tr><tr><td class="val" bgcolor="#E6E6E6"><b>Hynix</b></td></tr><tr><td class="parnm" bgcolor="#F9F9F9">Part Number</td></tr><tr><td class="val" bgcolor="#F9F9F9">H5AN8G8N<b>DJR</b>-TFC</td></tr><tr><td class="parnm" bgcolor="#E6E6E6">（后略）</td></tr></tbody></table>

<img src="https://user-images.githubusercontent.com/14539571/71509234-85bc9200-283f-11ea-95bc-4d479da497d7.jpg" alt="21C" width="650"/>

仔细看序列号上方的这串特征码“04213X88**21C**”。根据[这个帖子](https://www.chiphell.com/thread-1789652-1-1.html)总结的规律，以20C和21C结尾的内存条是**Hynix CJR**！而以20D和21D结尾的内存条才是Hynix DJR。

### 第三步：调整电压、倍频和主要时序
内存调试的步骤冗长，因此最简单的超频方法是直接使用别人测试过且稳定的时序，比如参考[DRAM Calculator for Ryzen](https://www.techpowerup.com/download/ryzen-dram-calculator/)：
<img src="https://user-images.githubusercontent.com/14539571/69910385-7f153900-13bf-11ea-9911-74ce028a53a5.png" alt="DRAM Calculator for Ryzen - Safe preset 3733" width="650"/>

但我还是使用了试错（trial and error）的方式进行超频。完全照抄别人的数据，超频的乐趣就少了很多。

首先将内存电压（DRAM Voltage）调到1.45V，超频稳定后逐渐减电压（最后减少到**1.39V**）。Hynix CJR对电压比较敏感，相比之下Hynix DJR和Samsung B-Die可以日常跑1.5V甚至更高。

随后将内存倍频（System Memory Multiplier）设置为**37.33**；将FClk设置为1867MHz。(前文提到的1:1)

接下来将主要时序（primary timings）设置为18-22-22-48-1T，并逐项收紧：

> 注：
> 
> * Gear Down Mode默认开启，因此跳过了奇数tCR
> * Power Down Mode关闭
> * tRRDS = 4, tRRDL = 6, tFAW = 24, tWR = 12

| **tCL**     | 18   | 16   | **16**   | 16     | 16     | 16     |
| **tRCD(RD)**| 22   | 22   | **21**   | 20     | 19     | 18     |
| **tRP**     | 22   | 22   | **21**   | 20     | 19     | 18     |
| **tRAS**    | 48   | 40   | **39**   | 38     | 37     | 36     |
| **是否POST？** | POST | POST | POST | POST   | POST   | 无POST |
| **是否稳定？** | - | - | 稳定 | 不稳定 | 不稳定 | - |

（续）

| **tCL**     | 16   | **16**   | 16     |
| **tRCD(RD)**| 20   | **19**   | 18     |
| **tRP**     | 21   | **21**   | 21     |
| **tRAS**    | 37   | **36**   | Auto   |
| **是否POST？** | POST | POST | 无POST |
| **是否稳定？** | 稳定 | 稳定（@1.39V） | - |


（续）

| **tCL**     | 16   | 16   |
| **tRCD(RD)**| 19   | 19   |
| **tRP**     | 20   | 20   |
| **tRAS**    | 36   | Auto |
| **是否POST？** | POST | POST |
| **是否稳定？** | 不稳定 | 不稳定 |

根据以上测试的结果，最紧且稳定的主要时序为**16-19-21-36-1T**。

### 第四步：调整第二时序和第三时序
在X570平台上，第二时序/次要时序（secondary timings）包括：**tRC tWR tCWL tRDDS tRDDL tWTRS tWTRL tRFC tRTP tFAW**。以下是收紧后的结果：

| tRC  | tWR | tCWL | tRRDS | tRRDL | tWTRS | tWTRL | tRFC | tRTP | tFAW |
|------|-----|------|-------|-------|-------|-------|------|------|------|
| 58   | 10  | 14   | 4     | 6     | 4     | 10    | 487  | 8    | 16   |

第三时序（tertiary timings）包括：**tRDWR tRDRD_SC tRDRD_SD tRDRD_DD tRDRD_SCL tWRRD tWRWR_SC tWRWR_SD tWRWR_DD tWRWR_CSL tCKE**。其中大部分参数都留在Auto，手动设置了：

| tRDRD_SCL | tWRWR_CSL | tCKE |
|-----------|-----------|------|
| 4         | 4         | 1    |

### 第五步：稳定性测试
能开机并不代表系统稳定。测试超频的稳定性时使用了软件[HCi MemTest](https://hcidesign.com/memtest/)（下图）。判断稳定的基准为：400%覆盖，0错误。

<img src="https://user-images.githubusercontent.com/14539571/69910356-1037e000-13bf-11ea-8c59-493646183f33.png" alt="memtest - standard version"/>

### 第六步：基准测试
从XMP到手动超频，性能到底提升了多少？不使用MemClk : FClk = 1:1对性能的影响有多大？测试内存的读、写、复制和延迟使用了[AIDA64 Extreme](https://www.aida64.com/) 6.20.5300。结果如下：（测试误差较大）

|          | 读（MB/s） | 写（MB/s） | 复制（MB/s） | 延迟 (ns) |
|----------|------------|------------|--------------|-----------|
| 2133CL15 (JEDEC) | 31500 | 19157 | 32975 | 105.3 |
| **3600CL16 (XMP)** | **51512** | **28739** | **51225** | **72.5** |
| 3666CL16 (OC) | 53526 | 29270 | 52921 | 69.6 |
| **3733CL16 (OC)** | **54280** | **29827** | **54130** | **68.4** |
| 3800CL16 (OC, 1:1, 不稳定) | 55182 | 30338 | 55203 | 67.7 |
| 4266CL18 (Auto, 2:1) | 51355 | 28744 | 53658 | **80.1** |

由以上数据，我们证实了：
1. Ryzen 3000系列CPU的内存频率甜点通常在3600-3800MT/s之间，甜点受制于Infinity Fabric的频率（FClk）上限
2. 去耦（decoupling）MemClk和FClk（例如：2:1）会使内存延迟显著提升

通过超频，内存获得了5%左右的**免费**性能提升！

### 鸣谢
Youtube：
* [Actually Hardcore Overclocking](https://www.youtube.com/channel/UCrwObTfqv8u1KO7Fgk-FXHQ)
* [Toppc Lin](https://www.youtube.com/channel/UCcBHyNvAbtxX8TRJYSQiObw)

文章：
* [AMD Ryzen Memory Tweaking & Overclocking Guide](https://www.techpowerup.com/review/amd-ryzen-memory-tweaking-overclocking-guide/) by 1usmus
* [DDR4 OC Guide](https://github.com/integralfx/MemTestHelper/blob/master/DDR4%20OC%20Guide.md)
* [What Are Memory Timings? CAS Latency, tRCD, tRP, & tRAS (Pt 1) ](https://www.gamersnexus.net/guides/3333-memory-timings-defined-cas-latency-trcd-trp-tras) by Patrick Lathan