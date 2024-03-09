---
layout: page
title: 关于 Kwritin
---

### Welcome! 

**Kwritin**(Keep Writing) 是我的技术博客。

我是一名从事服务端开发，数据工程相关的程序员。
维护博客主要是为了学习、分享。

欢迎各位大佬在评论区留言交流，或是电邮(base64): `bHNodWh1YW5AeWVhaC5uZXQK`。

{% assign dq_url = site.url | append: page.url %}

{% if site.env == "production" and page.commentable != false %}
<div id="disqus_thread" style="margin: 2rem 0;">Disqus is loading...</div>
<script>
  var disqus_config = function () {
    this.page.url = '{{ dq_url }}';          // Replace PAGE_URL with your page's canonical URL variable
    this.page.identifier = '{{ page.url }}'; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
  };
  /**
    * RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
    * LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables
    */
  (function () {  // REQUIRED CONFIGURATION VARIABLE: EDIT THE SHORTNAME BELOW
    var commentArea = document.querySelector('#disqus_thread');
    if (!commentArea) {
        return;
    }
    var d = document, s = d.createElement('script');
    s.src = 'https://toien-github-pages.disqus.com/embed.js';  // IMPORTANT: Replace EXAMPLE with your forum shortname!
    s.onerror = function () {
        commentArea.textContent = 'Disqus load failed, try internet scientifically.'
    };
    s.setAttribute('data-timestamp', +new Date());
    (d.head || d.body).appendChild(s);
  })();
</script>
{% endif %}
