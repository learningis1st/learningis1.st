---
layout: post
title:  "探索内存超频之旅 (G.Skill Trident Z Neo)"
categories: blog
---

<div id="google_translate_element"></div>

<script type="text/javascript">
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'zh'}, 'google_translate_element');
}
</script>

<script type="text/javascript" src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"></script>

<br>

<img src="/images/assembled-pc-no-case.webp" alt="RGB点亮" width="500"/>

DDR4内存价格已跌至历史最低，且趋势显示不会反弹。[据市场预测](https://www.gartner.com/en/newsroom/press-releases/2019-07-22-gartner-says-worldwide-semiconductor-revenue-to-decline-9point6-percent-in-2019)，DRAM供大于求的状态将持续到2020年第二季度。尽管半导体公司正在亏损，但对于PC爱好者来说，这是个好消息。

下图是我本月早些时候在Newegg上购买的两条G.SKILL Trident Z Neo，型号[F4-3600C16D-32GTZNC](https://www.gskill.com/product/165/326/1562840211/F4-3600C16D-32GTZNC)，有效速度3600MT/s，时序16-19-19-39，电压1.35V。本文记录了我在X570平台上尝试内存超频的经验。

<img src="/images/trident-z-neo.webp" alt="包装" width="500"/>

### 第一步：最大化FClk
在AMD平台上，[**Infinity Fabric**](https://en.wikichip.org/wiki/amd/infinity_fabric)是控制组件间数据传输的关键互连架构。Infinity **F**abric的频率参数在X570平台上通称为**FClk**（**F**-Clock）。

根据AMD在Computex上展示的幻灯片，Ryzen 3000系列CPU的内存频率甜点在3733MT/s，此时FClk为1867MHz，MemClk和FClk之间的比例为1:1。超过3733MT/s后，比例变为2:1，内存延迟明显上升。

<img src="/images/raw-memory-latency-chart.webp" alt="内存频率甜点" width="650"/>

为了获得最佳性能，MemClk和FClk的比例应保持1:1。虽然“甜点”为3733MT/s，但并非每颗Ryzen 3000系列CPU都能达到这一频率。如果你的运气不太好，可以尝试逐渐增加BIOS中的CLDO_**VDDG**电压参数，直到接近SoC电压（默认1.1V）。

### 第二步：确认内存颗粒
无论内存条的RGB灯光多么夺目，全球只有三家主要内存元件制造商：**美光** (Micron)、**SK海力士** (SK Hynix)和**三星** (Samsung)。确定内存制造商和内存颗粒（die）类型可以很大程度上预测内存条的超频潜力。

使用软件[Thaiphoon Burner](http://www.softnology.biz/)查看SPD固件信息......获得了错误的颗粒信息：

<table border="0" cellpadding="0" cellspacing="0" width="230" align="left"><tbody><tr><th><b>DRAM COMPONENTS</b></th></tr><tr><td class="parnm" bgcolor="#E6E6E6">Manufacturer</td></tr><tr><td class="val" bgcolor="#E6E6E6"><b>Hynix</b></td></tr><tr><td class="parnm" bgcolor="#F9F9F9">Part Number</td></tr><tr><td class="val" bgcolor="#F9F9F9">H5AN8G8N<b>DJR</b>-TFC</td></tr><tr><td class="parnm" bgcolor="#E6E6E6">（后略）</td></tr></tbody></table>

<img src="/images/f4-3600c16d-32gtznc.webp" alt="21C" width="650"/>

仔细观察序列号上方的特征码“04213X88**21C**”，根据[这个帖子](https://www.chiphell.com/thread-1789652-1-1.html)总结的规律，以20C和21C结尾的内存条是**Hynix CJR**。而以20D和21D结尾的内存条才是Hynix DJR。

### 第三步：调整电压、倍频和主要时序
内存超频需要一系列繁琐的步骤，所以最简单的方法是直接使用其他人经过测试且稳定的时序，例如[DRAM Calculator for Ryzen](https://www.techpowerup.com/download/ryzen-dram-calculator/)：
<img src="/images/dram-calculator-for-ryzen.webp" alt="DRAM Calculator for Ryzen - Safe preset 3733" width="650"/>

然而，我更愿意通过试错的方式进行超频，因为这样才能真正体验到超频的乐趣。首先，我将内存电压（DRAM Voltage）调至1.45V，然后逐渐降低至**1.39V**。Hynix CJR对电压非常敏感，相比之下，Hynix DJR和Samsung B-Die可以安全运行在1.5V甚至更高电压下。

接下来，我将内存倍频（System Memory Multiplier）设置为**37.33**，将FClk设置为1867MHz（如前文所述，保持1:1比例）。

然后，我调整主要时序（primary timings）为18-22-22-48-1T，并逐项逐渐收紧。

> 注：
> 
> * 默认情况下Gear Down Mode是开启的，所以我跳过了奇数tCL的值。
> * 关闭了Power Down Mode。
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

根据上述测试结果，最紧且稳定的主要时序为**16-19-21-36-1T**。

### 第四步：调整第二时序和第三时序
在X570平台上，第二时序/次要时序（secondary timings）包括：**tRC tWR tCWL tRDDS tRDDL tWTRS tWTRL tRFC tRTP tFAW**。以下是我调整后的结果：

| tRC  | tWR | tCWL | tRRDS | tRRDL | tWTRS | tWTRL | tRFC | tRTP | tFAW |
|------|-----|------|-------|-------|-------|-------|------|------|------|
| 58   | 10  | 14   | 4     | 6     | 4     | 10    | 487  | 8    | 16   |

第三时序（tertiary timings）包括：**tRDWR tRDRD_SC tRDRD_SD tRDRD_DD tRDRD_SCL tWRRD tWRWR_SC tWRWR_SD tWRWR_DD tWRWR_CSL tCKE**。其中大部分参数都留在Auto状态，我手动设置了以下参数：

| tRDRD_SCL | tWRWR_CSL | tCKE |
|-----------|-----------|------|
| 4         | 4         | 1    |

### 第五步：稳定性测试
能开机并不代表系统稳定。在测试内存超频的稳定性时，我使用了[HCi MemTest](https://hcidesign.com/memtest/)软件，作为稳定的标准，我进行了400%的覆盖率测试。

<img src="/images/memtest.webp" alt="memtest - standard version"/>

### 第六步：基准测试
从启用XMP到手动超频，性能提升了多少？不使用MemClk : FClk = 1:1比例对性能有何影响？我使用[AIDA64 Extreme](https://www.aida64.com/) 6.20.5300进行了内存读取、写入、复制和延迟的基准测试。以下是结果（请注意测试误差较大）：

|          | 读（MB/s） | 写（MB/s） | 复制（MB/s） | 延迟 (ns) |
|----------|------------|------------|--------------|-----------|
| 2133CL15 (JEDEC) | 31500 | 19157 | 32975 | 105.3 |
| **3600CL16 (XMP)** | **51512** | **28739** | **51225** | **72.5** |
| 3666CL16 (OC) | 53526 | 29270 | 52921 | 69.6 |
| **3733CL16 (OC)** | **54280** | **29827** | **54130** | **68.4** |
| 3800CL16 (OC, 1:1, 不稳定) | 55182 | 30338 | 55203 | 67.7 |
| 4266CL18 (Auto, 2:1) | 51355 | 28744 | 53658 | **80.1** |

根据这些数据，我们证实了以下结论：
1. Ryzen 3000系列CPU的内存频率甜点通常在3600-3800MT/s之间，这一甜点受制于Infinity Fabric的频率上限（FClk）。
2. 解耦（decoupling）MemClk和FClk（例如：2:1比例）会显著提高内存延迟。

通过超频，内存性能提升了约5%。

### 鸣谢
视频资源：
* [Actually Hardcore Overclocking](https://www.youtube.com/channel/UCrwObTfqv8u1KO7Fgk-FXHQ)
* [Toppc Lin](https://www.youtube.com/channel/UCcBHyNvAbtxX8TRJYSQiObw)

文章参考：
* [AMD Ryzen Memory Tweaking & Overclocking Guide](https://www.techpowerup.com/review/amd-ryzen-memory-tweaking-overclocking-guide/) by 1usmus
* [DDR4 OC Guide](https://github.com/integralfx/MemTestHelper/blob/master/DDR4%20OC%20Guide.md)
* [What Are Memory Timings? CAS Latency, tRCD, tRP, & tRAS (Pt 1) ](https://www.gamersnexus.net/guides/3333-memory-timings-defined-cas-latency-trcd-trp-tras) by Patrick Lathan