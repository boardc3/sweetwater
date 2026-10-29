document.querySelectorAll('[data-slider]').forEach(s=>{const i=s.querySelector('input');const f=()=>s.style.setProperty('--p',i.value+'%');i.addEventListener('input',f);f();});
const b=document.querySelector('.menu'),n=document.getElementById('nav');if(b&&n)b.addEventListener('click',()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)});
const v=document.querySelector('.hero-v');if(v&&matchMedia('(prefers-reduced-motion: reduce)').matches){v.pause();}
