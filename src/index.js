import './style.css';

let articles = [];
let currentFilter = 'all';
const KEYWORDS = [
  'AI',
  'Digital Twin',
  'NVIDIA',
  '디지털 트윈',
  '엔비디아',
  'Omniverse',
];

// 다크 모드 토글
document.getElementById('darkTab').onclick = () => {
  const theme = document.documentElement.getAttribute('data-theme');
  document.documentElement.setAttribute(
    'data-theme',
    theme === 'dark' ? 'light' : 'dark'
  );
};

// 키워드 하이라이트
function highlight(text) {
  let html = text;
  KEYWORDS.forEach((word) => {
    const reg = new RegExp(word, 'gi');
    html = html.replace(reg, (m) => `<mark class="hl">${m}</mark>`);
  });
  return html;
}

// 뉴스 수집 (최근 7일 제한)
document.getElementById('fetchBtn').onclick = async () => {
  const status = document.getElementById('status');
  status.innerText = '⏳ 최근 7일간의 데이터를 분석 중...';

  const searchKeywords = ['AI', 'Digital Twin', 'NVIDIA'];

  try {
    const fetchPromises = searchKeywords.map(async (word) => {
      const q = encodeURIComponent(`${word} when:7d`);
      const rss = encodeURIComponent(
        `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`
      );
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${rss}`
      );
      const data = await res.json();
      return data.items || [];
    });

    const results = await Promise.all(fetchPromises);

    // 중복 제거
    const uniqueMap = new Map();
    results.flat().forEach((item) => uniqueMap.set(item.link, item));
    articles = Array.from(uniqueMap.values()).sort(
      (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
    );

    updateStats();
    renderNews(); // 수집 후 첫 렌더링
    status.innerText = `✅ 분석 완료! (최근 7일 기사 ${articles.length}건)`;
  } catch (e) {
    status.innerText = '❌ 오류가 발생했습니다.';
  }
};

// 통계 업데이트
function updateStats() {
  const check = (regexStr) =>
    articles.filter((a) => new RegExp(regexStr, 'i').test(a.title)).length;

  document.getElementById('total-count').innerText = articles.length;
  document.getElementById('ai-count').innerText = check('AI|인공지능');
  document.getElementById('twin-count').innerText = check(
    'Digital Twin|디지털 트윈'
  );
  document.getElementById('nvidia-count').innerText = check('NVIDIA|엔비디아');
}

// 탭 필터링 이벤트 (중요!)
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.onclick = (e) => {
    // 버튼 UI 상태 변경
    document
      .querySelectorAll('.tab-btn')
      .forEach((b) => b.classList.remove('active'));
    e.currentTarget.classList.add('active');

    // 필터 값 업데이트 및 렌더링
    currentFilter = e.currentTarget.dataset.filter;
    console.log('현재 필터:', currentFilter); // 디버깅용
    renderNews();
  };
});

function renderNews() {
  const container = document.getElementById('newsContainer');

  // 기사 분류 로직 보강
  const filtered = articles.filter((a) => {
    if (currentFilter === 'all') return true;

    // Digital Twin의 경우 공백이나 한글 대응을 위해 정규표현식 유연화
    let searchPattern = currentFilter;
    if (currentFilter === 'Digital Twin')
      searchPattern = 'Digital Twin|디지털 트윈';
    if (currentFilter === 'AI') searchPattern = 'AI|인공지능';
    if (currentFilter === 'NVIDIA') searchPattern = 'NVIDIA|엔비디아';

    const regex = new RegExp(searchPattern, 'i');
    return regex.test(a.title);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="no-data">해당 카테고리에 수집된 기사가 없습니다.</div>`;
    return;
  }

  container.innerHTML = filtered
    .map(
      (a) => `
    <div class="news-card">
      <div class="card-tag">${
        currentFilter === 'all' ? 'TREND' : currentFilter
      }</div>
      <h4>${highlight(a.title)}</h4>
      <div class="info">
        <span>${a.author || '언론사'}</span> | 
        <span>${a.pubDate.split(' ')[0]}</span>
      </div>
      <a href="${a.link}" target="_blank">기사 읽기 →</a>
    </div>
  `
    )
    .join('');
}

// CSV 저장
document.getElementById('downloadBtn').onclick = () => {
  if (articles.length === 0) return alert('수집된 데이터가 없습니다.');
  const csv =
    '\ufeffTitle,Publisher,Date,URL\n' +
    articles
      .map(
        (a) =>
          `"${a.title.replace(/"/g, '')}",${a.author},${a.pubDate},${a.link}`
      )
      .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `TechNews_7Days.csv`;
  a.click();
};
