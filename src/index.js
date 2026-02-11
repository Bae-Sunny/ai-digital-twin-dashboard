import './style.css';

let articles = [];
let currentFilter = 'all';
const KEYWORDS = ['AI', 'Digital Twin', 'NVIDIA', '디지털 트윈', '엔비디아', 'Robot', '로봇', '로보틱스'];

// 다크 모드 토글
document.getElementById('darkTab').onclick = () => {
  const theme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
};

// 키워드 하이라이트
function highlight(text) {
  let html = text;
  KEYWORDS.forEach(word => {
    const reg = new RegExp(word, 'gi');
    html = html.replace(reg, (m) => `<mark class="hl">${m}</mark>`);
  });
  return html;
}

// 뉴스 수집 (최근 7일 & 병렬 검색)
document.getElementById('fetchBtn').onclick = async () => {
  const status = document.getElementById('status');
  status.innerText = '⏳ 최근 7일간의 테크 데이터를 분석 중...';
  
  // 검색 키워드 정의
  const searchKeywords = ['AI', 'Digital Twin', 'NVIDIA', 'Robot'];
  
  try {
    const fetchPromises = searchKeywords.map(async (word) => {
      const q = encodeURIComponent(`${word} when:7d`);
      const rss = encodeURIComponent(`https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`);
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rss}`);
      const data = await res.json();
      return data.items || [];
    });

    const results = await Promise.all(fetchPromises);
    
    // 중복 제거 (URL 기준)
    const uniqueMap = new Map();
    results.flat().forEach(item => uniqueMap.set(item.link, item));
    
    articles = Array.from(uniqueMap.values()).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    updateStats();
    renderNews();
    status.innerText = `✅ 수집 완료! (최근 7일 기사 ${articles.length}건)`;
  } catch (e) {
    status.innerText = '❌ 오류가 발생했습니다.';
  }
};

// 통계 업데이트 (Digital Twin에 로봇 통합)
function updateStats() {
  const check = (regexStr) => articles.filter(a => new RegExp(regexStr, 'i').test(a.title)).length;
  
  document.getElementById('total-count').innerText = articles.length;
  document.getElementById('ai-count').innerText = check('AI|인공지능');
  // Digital Twin 카운트에 로봇/로보틱스 포함
  document.getElementById('twin-count').innerText = check('Digital Twin|디지털 트윈|Robot|로봇|로보틱스');
  document.getElementById('nvidia-count').innerText = check('NVIDIA|엔비디아');
}

// 탭 필터링
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.onclick = (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.currentTarget.classList.add('active');
    currentFilter = e.currentTarget.dataset.filter;
    renderNews();
  };
});

function renderNews() {
  const container = document.getElementById('newsContainer');
  
  const filtered = articles.filter(a => {
    if (currentFilter === 'all') return true;
    
    let searchPattern = currentFilter;
    // Digital Twin 탭일 경우 로봇 관련 키워드까지 필터 확장
    if (currentFilter === 'Digital Twin') {
      searchPattern = 'Digital Twin|디지털 트윈|Robot|로봇|로보틱스';
    } else if (currentFilter === 'AI') {
      searchPattern = 'AI|인공지능';
    } else if (currentFilter === 'NVIDIA') {
      searchPattern = 'NVIDIA|엔비디아';
    }
    
    return new RegExp(searchPattern, 'i').test(a.title);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-data">최근 7일간 해당 카테고리의 기사가 없습니다.</div>`;
    return;
  }

  container.innerHTML = filtered.map(a => `
    <div class="news-card">
      <h4>${highlight(a.title)}</h4>
      <div class="info">
        <span>${a.author || 'News'}</span> | 
        <span>${a.pubDate.split(' ')[0]}</span>
      </div>
      <a href="${a.link}" target="_blank">기사 원문 보기 →</a>
    </div>
  `).join('');
}

// CSV 저장
document.getElementById('downloadBtn').onclick = () => {
  if (articles.length === 0) return alert('데이터가 없습니다.');
  const csv = "\ufeffTitle,Publisher,Date,URL\n" + articles.map(a => 
    `"${a.title.replace(/"/g,'')}",${a.author},${a.pubDate},${a.link}`
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `TechNews_Dashboard.csv`;
  a.click();
};