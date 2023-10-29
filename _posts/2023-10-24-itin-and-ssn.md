---
layout: post
title:  "从ITIN到SSN：我的税号转换经历"
date:   2023-10-24
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

当涉及到在美国炒股或申请税收退款时，你可能会发现自己需要一个[纳税识别号码](https://www.irs.gov/individuals/individual-taxpayer-identification-number)（Individual Taxpayer Identification Number, **ITIN**）或[社会保障号码](https://www.ssa.gov/number-card)（Social Security number, **SSN**）。虽然它们在某种程度上相似，都是9位数，格式是xxx-xx-xxxx，但它们之间还是存在一些差异。在这篇博文中，我将分享我的个人经历，描述如何获取ITIN，并如何将ITIN替换为SSN。这一经历伴随着繁琐的步骤和漫长的等待，我希望通过分享我的经验，能够帮助你更深入地了解这一复杂过程。

# 首先：获取ITIN
##### 时间：2022年3月21日

我需要获得ITIN是因为我在美国炒股，[这需要我向IRS（美国国税局）申请退税](https://www.irs.gov/taxtopics/tc857)。但由于我没有社会保障号码，我必须获得一个ITIN。

> Examples of Individuals Who Need an ITIN: 
>
> ...
>
> A nonresident alien filing a U.S. tax return
>
> ...

<img src="/images/103.webp" alt="Welcome to IRS, Spokane, WA. Please have a seat and wait for your number to be called." width="225"/>

我前往当地的IRS纳税人协助中心（Taxpayer Assistance Center, TAC）提交了[W-7表](https://www.irs.gov/forms-pubs/about-form-w-7)，这是申请ITIN所需的关键表格。幸运的是，在TAC提交申请，我就不用[将护照**原件**邮寄给IRS](https://www.irs.gov/individuals/how-do-i-apply-for-an-itin)：

> Make an appointment at a designated IRS Taxpayer Assistance Center. This will also prevent you from having to mail your proof of identity and foreign status document 



<img src="/images/irs_office.webp" alt="IRS Office" width="300"/>


此外，我还同时递交了我前两年（2020，2021）的[1040NR纳税申报表](https://www.irs.gov/forms-pubs/about-form-1040-nr)。在1040NR表中的"Your identifying number"一栏，我填写了"APPLIED FOR"，表明我正在申请ITIN。完成整个过程后，我获得了这份通知，上面写明我需要等待9到11个星期，才能收到关于ITIN申请的答复。

![Form 14562 - What Happens Next With My ITIN Application](/images/f14562.webp)

# 收到ITIN和退税

经过漫长的等待，我终于在2022年5月底收到了[CP565](https://www.irs.gov/individuals/understanding-your-cp565-notice)的纸质信函。这封信通知我，ITIN申请已经获批准，IRS已经为我分配了个人纳税识别号码。


2022年8月中旬，我收到了2020和2021纳税年度的退税。这是我这辈子收到的第一笔退税。

# 使用ITIN的挑战

然而，在使用ITIN的过程中，我逐渐意识到，与SSN相比，ITIN存在一些使用上的挑战。许多金融科技公司的应用程序，如Cash App、Robinhood等，不接受ITIN用于验证身份。此外，一些银行不允许使用ITIN来开设信用卡账户，例如US Bank。如果使用ITIN，[你的信用记录也无法在线查询](https://www.annualcreditreport.com/generalQuestions.action)，只能通过电话验证身份，然后通过邮寄方式获取纸质信用报告。

# 得到社保号后......
##### 时间：2023年9月底

我最终获得了自己的社会保障号码！这是一个令我兴奋的时刻。庆祝了十分钟后，我创建了一个列表，其中有23个项目，包括政府机构、学校、银行、券商、金融科技公司、加密货币交易所、三大信用报告机构以及我的会计师。我需要将我的ITIN更新为新获得的社保号，以确保我的金融和税务事务能够顺畅过渡。

这个过程中，有些机构能够轻松解决我的问题，而另一些则需要复杂和额外的步骤。下面是一些我遇到的情况：

#### 😑 能轻松解决问题的：

* Washington State Department of Licensing（打电话，等待人工服务10分钟，总共花费20分钟）
* 学校 Student Account（为了收到正确的[1098-T表格](https://www.irs.gov/forms-pubs/about-form-1098-t)，通过在线方式提交[W-9S表格](https://www.irs.gov/forms-pubs/about-form-w-9s)）
* Charles Schwab、TD Ameritrade（通过在线方式提交[W-9表格](https://www.irs.gov/forms-pubs/about-form-w-9)）
* PayPal、Coinbase、Stripe（可以在线直接更改）

#### 😠 需要跑一趟解决问题的：

* IRS（我需要联系IRS以[吊销我的旧ITIN并合并我的税收档案](https://www.irs.gov/individuals/itin-expiration-faqs)）

> Q20: I have a Social Security Number (SSN) and no longer need my ITIN that will be expiring. Do I need to renew my ITIN?
>
> A20: No, you should not renew your ITIN if you have or are eligible for an SSN.  Please notify us that you have obtained an SSN and no longer need the ITIN by visiting a local IRS office or writing a letter explaining that you have now been assigned an SSN and want your tax records combined.

* 银行（如大通银行等，必须亲自前往网点进行更新）

#### 😡 不能简单解决问题的：

* 三大信用报告机构（其中：[Experian](https://www.experian.com/consumer/upload/)和[Equifax](https://www.equifax.com/personal/credit-report-services/credit-dispute/)可在线提交纠纷；但如果要提交关于SSN的纠纷，[TransUnion](https://www.transunion.com/credit-disputes/dispute-your-credit/mail-or-phone)只接受纸质信件）
* American Express（只接受传真和纸质信件，这点让我特别失望）
* Fidelity（税号与用户名强制关联，更换税号就要重新注册，并重新设置账户）
* ID.me（需要关闭账号，等待7天，重新注册，重新验证驾照、地址和我的学生身份）


#### 🤬 完全不能解决问题的：

* Venmo
* Google Fi（Google Pay）

截止到撰写本文的时候，三大信用报告机构中还有一家尚未对我做出答复。在总共23家机构中，还有5家没有完成到SSN的过渡。