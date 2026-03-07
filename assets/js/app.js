/* MATMOTO app.js
   - Reveal on scroll
   - Hero switch 2/3 (works with img OR placeholder)
   - Parallax hero (only if heroImage exists)
   - 360 viewer: drag/touch + inertia
   - Autorotate SUPER SLOW (1200ms/frame)
   - Stop on drag, resume after 3s idle
   - Contact order: WhatsApp order + optional geolocation
*/

document.addEventListener("DOMContentLoaded", function () {

  // --------------------
  // Reveal on scroll
  // --------------------
  const elements = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
        }
      });
    },{ threshold:0.15 });

    elements.forEach(function(el){ observer.observe(el); });
  } else {
    elements.forEach(function(el){ el.classList.add("is-visible"); });
  }

  // --------------------
  // Hero switch (index)
  // --------------------
  const heroImage = document.getElementById("heroImage");               // optional
  const heroModelLabel = document.getElementById("heroModelLabel");     // optional (placeholder)
  const spec1 = document.getElementById("spec1");                       // optional
  const spec2 = document.getElementById("spec2");                       // optional
  const buttons = document.querySelectorAll(".switch-btn");

  function setHero(mode){
    // update image if exists
    if (heroImage) {
      if (mode === "3") heroImage.src = "assets/img/hero/hero-3rrota.png";
      else heroImage.src = "assets/img/hero/hero-2rrota.png";
    }

    // update placeholder label if exists
    if (heroModelLabel) {
      heroModelLabel.textContent = (mode === "3") ? "3 RROTA • Preview";
    }

    // update specs (placeholder for now)
    if (spec1 && spec2) {
      if (mode === "3") {
        spec1.textContent = "Range / shpejtësi (placeholder)";
        spec2.textContent = "Ngarkesa / përdorimi (placeholder)";
      } else {
        spec1.textContent = "Range / shpejtësi (placeholder)";
        spec2.textContent = "Ngarkesa / përdorimi (placeholder)";
      }
    }

    // toggle active button UI
    buttons.forEach(function(btn){
      btn.classList.toggle("is-active", (btn.dataset.hero || "2") === mode);
    });
  }

  if (buttons && buttons.length) {
    buttons.forEach(function(btn){
      btn.addEventListener("click", function(){
        setHero(btn.dataset.hero || "2");
      });
    });
  }

  // --------------------
  // Parallax (only if heroImage exists)
  // --------------------
  let ticking = false;

  function onScroll(){
    if (!heroImage) return;
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(function(){
      const y = window.scrollY || 0;
      const offset = Math.min(22, y * 0.06);
      heroImage.style.transform = "translate(-50%, -50%) translateY(" + offset + "px)";
      ticking = false;
    });
  }

  window.addEventListener("scroll", onScroll, { passive:true });
  onScroll();

  // --------------------
  // 360 Viewer + inertia
  // --------------------
  const viewers = document.querySelectorAll(".viewer360");

  function pad3(n){
    const s = String(n);
    if (s.length === 1) return "00" + s;
    if (s.length === 2) return "0" + s;
    return s;
  }

  function initViewer(el){

    const img = el.querySelector(".viewer360-img");
    if (!img) return;

    const frames = Number(el.getAttribute("data-frames") || 24);
    const path = el.getAttribute("data-path") || "";
    const ext  = el.getAttribute("data-ext")  || "jpg";

    let index = 1;
    let isDown = false;
    let lastX = 0;
    let acc = 0;

    // Drag feel
    const stepPx = 18;

    // autorotate
    let autoTimer = null;
    let resumeTimer = null;

    // inertia
    let v = 0;
    let raf = null;

    function setFrame(i){
      const safe = ((i - 1 + frames) % frames) + 1;
      index = safe;
      img.src = path + pad3(index) + "." + ext;
    }

    // preload (max 24)
    const preloadCount = Math.min(frames, 24);
    for (let i = 1; i <= preloadCount; i++){
      const im = new Image();
      im.src = path + pad3(i) + "." + ext;
    }

    setFrame(1);

    function stepBy(dx){
      acc += dx;

      while (acc >= stepPx){
        acc -= stepPx;
        setFrame(index + 1);
      }

      while (acc <= -stepPx){
        acc += stepPx;
        setFrame(index - 1);
      }
    }

    function startAuto(){
      if (autoTimer) return;
      autoTimer = setInterval(function(){
        setFrame(index + 1);
      }, 1200); // SUPER SLOW
    }

    function stopAuto(){
      if (!autoTimer) return;
      clearInterval(autoTimer);
      autoTimer = null;
    }

    function resumeLater(){
      clearTimeout(resumeTimer);
      resumeTimer = setTimeout(function(){
        startAuto();
      }, 3000);
    }

    function stopInertia(){
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      v = 0;
    }

    function runInertia(){
      stopInertia();

      if (Math.abs(v) < 0.5){
        v = 0;
        resumeLater();
        return;
      }

      raf = requestAnimationFrame(function tick(){
        v *= 0.92; // friction

        if (Math.abs(v) < 0.4){
          stopInertia();
          resumeLater();
          return;
        }

        stepBy(v);
        raf = requestAnimationFrame(tick);
      });
    }

    startAuto();

    el.addEventListener("pointerdown", function(e){
      isDown = true;
      lastX = e.clientX;
      stopAuto();
      clearTimeout(resumeTimer);
      stopInertia();
      v = 0;
      try{ el.setPointerCapture(e.pointerId); }catch(_){}
    });

    el.addEventListener("pointermove", function(e){
      if (!isDown) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;

      v = (v * 0.6) + (dx * 0.4);
      stepBy(dx);
    });

    function pointerUp(){
      if (!isDown) return;
      isDown = false;
      runInertia();
    }

    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);
    el.addEventListener("pointerleave", pointerUp);

    el.addEventListener("touchstart", function(e){
      if (!e.touches || !e.touches[0]) return;

      isDown = true;
      lastX = e.touches[0].clientX;

      stopAuto();
      clearTimeout(resumeTimer);
      stopInertia();
      v = 0;
    }, { passive:true });

    el.addEventListener("touchmove", function(e){
      if (!isDown || !e.touches || !e.touches[0]) return;

      const x = e.touches[0].clientX;
      const dx = x - lastX;
      lastX = x;

      v = (v * 0.6) + (dx * 0.4);
      stepBy(dx);
    }, { passive:true });

    el.addEventListener("touchend", function(){
      if (!isDown) return;
      isDown = false;
      runInertia();
    }, { passive:true });

  }

  viewers.forEach(function(v){
    initViewer(v);
  });

  // --------------------
  // Contact order helpers (global)
  // --------------------
  function getOrderPayload(){
    const name  = (document.getElementById("orderName")  || {}).value || "";
    const phone = (document.getElementById("orderPhone") || {}).value || "";
    const email = (document.getElementById("orderEmail") || {}).value || "";
    const model = (document.getElementById("orderModel") || {}).value || "";
    const msg   = (document.getElementById("orderMsg")   || {}).value || "";
    const share = !!((document.getElementById("shareLocationChk") || {}).checked);

    return { name, phone, email, model, msg, share };
  }

  function openWhatsApp(text){
    const url = "https://wa.me/38349344884?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener");
  }

  window.sendOrderNoLocation = function(){
    const o = getOrderPayload();

    if (!o.name.trim() || !o.phone.trim() || !o.model.trim()){
      alert("Plotëso Emri, Telefoni dhe Produkti.");
      return;
    }

    const text =
`MATMOTO • POROSI

Emri: ${o.name}
Telefoni: ${o.phone}
Email: ${o.email || "-" }
Produkti: ${o.model}

Mesazh: ${o.msg || "-"}

Lokacion: (jo i dërguar)
`;

    openWhatsApp(text);
  };

  window.sendLocationOrder = function(){
    const o = getOrderPayload();

    if (!o.name.trim() || !o.phone.trim() || !o.model.trim()){
      alert("Plotëso Emri, Telefoni dhe Produkti.");
      return;
    }

    // if user unchecked share location -> send without location
    if (!o.share){
      window.sendOrderNoLocation();
      return;
    }

    if (!navigator.geolocation){
      alert("Lokacioni nuk mbështetet në këtë pajisje/browser.");
      window.sendOrderNoLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(pos){
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const text =
`MATMOTO • POROSI

Emri: ${o.name}
Telefoni: ${o.phone}
Email: ${o.email || "-" }
Produkti: ${o.model}

Mesazh: ${o.msg || "-"}

Lokacion (Google Maps):
https://maps.google.com/?q=${lat},${lon}
`;

        openWhatsApp(text);
      },
      function(err){
        // permission denied or error
        alert("Nuk u mor lokacioni (leja u refuzua ose pati gabim). Dërgojmë porosinë pa lokacion.");
        window.sendOrderNoLocation();
      },
      { enableHighAccuracy:true, timeout:10000, maximumAge:60000 }
    );
  };

});