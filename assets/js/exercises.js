(function(){
  var TOPIC_GROUP_EVEN = [1,2,3,4,5];
  var TOPIC_GROUP_ODD  = [6,7,8,9,10];

  function mulberry32(seed){
    return function(){
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function dateSeed(d){
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  function pickToday(rand){
    var today = new Date();
    var isEven = today.getDate() % 2 === 0;
    var group = isEven ? TOPIC_GROUP_EVEN : TOPIC_GROUP_ODD;
    var picks = [];
    group.forEach(function(topicId){
      var topic = EXERCISE_MANIFEST[String(topicId)];
      if (!topic || !topic.items.length) return;
      var idx = Math.floor(rand() * topic.items.length);
      var item = topic.items[idx];
      picks.push({ topicId: topicId, ko: topic.ko, vi: topic.vi, file: item.file, page: item.page });
    });
    return { isEven: isEven, picks: picks };
  }

  function cardHTML(p, num){
    return (
      '<div class="exercise-card">' +
        '<div class="exercise-topic">Chủ đề ' + p.topicId + '</div>' +
        '<button type="button" class="exercise-thumb" data-full="' + p.file + '" aria-label="Phóng to bài tập chủ đề ' + p.topicId + '">' +
          '<img src="' + p.file + '" alt="Bài tập cờ vây — ' + p.vi + ' (trang ' + p.page + ')" loading="lazy">' +
        '</button>' +
        '<h4>' + p.vi + '</h4>' +
        '<div class="exercise-meta">' + p.ko + ' · tr.' + p.page + '</div>' +
      '</div>'
    );
  }

  function render(seedOverride){
    var grid = document.getElementById('exercise-grid');
    var badge = document.getElementById('exercise-day-badge');
    if (!grid || typeof EXERCISE_MANIFEST === 'undefined') return;

    var rand = seedOverride
      ? mulberry32(seedOverride)
      : mulberry32(dateSeed(new Date()));

    var result = pickToday(rand);
    grid.innerHTML = result.picks.map(cardHTML).join('');

    if (badge) {
      badge.textContent = result.isEven
        ? 'Ngày chẵn — chủ đề 1–5'
        : 'Ngày lẻ — chủ đề 6–10';
    }
  }

  function openLightbox(src){
    var overlay = document.getElementById('exercise-lightbox');
    var img = document.getElementById('exercise-lightbox-img');
    if (!overlay || !img) return;
    img.src = src;
    overlay.hidden = false;
  }

  function closeLightbox(){
    var overlay = document.getElementById('exercise-lightbox');
    if (overlay) overlay.hidden = true;
  }

  document.addEventListener('DOMContentLoaded', function(){
    render();

    var grid = document.getElementById('exercise-grid');
    if (grid){
      grid.addEventListener('click', function(e){
        var btn = e.target.closest('.exercise-thumb');
        if (btn) openLightbox(btn.getAttribute('data-full'));
      });
    }

    var shuffleBtn = document.getElementById('exercise-shuffle');
    if (shuffleBtn){
      shuffleBtn.addEventListener('click', function(){
        render(Math.floor(Math.random() * 1e9));
      });
    }

    var overlay = document.getElementById('exercise-lightbox');
    if (overlay){
      overlay.addEventListener('click', closeLightbox);
    }
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape') closeLightbox();
    });
  });
})();
