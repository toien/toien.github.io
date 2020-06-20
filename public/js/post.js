scrollnav.init(document.querySelector('.content .post'), {
  sections: 'h2',
  subSections: 'h3',
  easingStyle: 'easeInOutCubic',
});

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