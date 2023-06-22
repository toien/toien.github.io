---
layout: page
title: 关于 Kwritin
---

**Kwritin**(Keep writing)，是我的技术博客。

这里的大部分文章都在讨论 web 开发技术: java, python, linux, mq, elasticsearch, 爬虫, 前端等等。

博主希望通过这种方式自驱学习，分享，进步。

如果文中有任何错误，敬请斧正。

Email(BASE64): bHNodWh1YW5AeWVhaC5uZXQK

{% assign dq_url = site.url | append: page.url %}

{% if page.comments != false %}
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
