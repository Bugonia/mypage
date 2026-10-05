const yearTarget = document.querySelector("[data-year]");
if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const translations = {
  zh: {
    title: "Bugonia | 个人主页",
    description: "仲笑秋的个人主页，记录研究、经历与其他作品。",
    navigation: "主页导航",
    languageSelector: "语言选择",
    avatarAlt: "Bugonia 的 GitHub 头像",
    displayName: "仲笑秋",
    navAbout: "简介",
    navPapers: "论文",
    navRecognition: "奖励与资助",
    navLinks: "推荐",
    paperSortLabel: "论文排序",
    linksSortLabel: "推荐链接排序",
    visitorsTitle: "访客地图",
    visitorsDescription: "最近访问主页的地区分布",
    visitorMapTitle: "主页访客地区分布",
    sortByYear: "年份",
    sortDefault: "默认",
    sortPopular: "热门",
    interactiveTool: "小程序 ↗",
    equalContribution: "* 共同第一作者",
    correspondingAuthor: "† 通讯作者",
    alphabeticalOrder: "‡ 作者按姓名字母顺序排列",
    recognitionTitle: "奖励与资助",
    awardsTitle: "奖励",
    fundingTitle: "资助",
    wuScholarship: "吴文俊奖学金",
    sjtuMath: "上海交通大学数学科学学院 ↗",
    weichaiScholarship: "潍柴动力奖学金",
    weichaiPower: "潍柴动力股份有限公司 ↗",
    tungScholarship: "董氏奖学金",
    tungFoundation: "香港董氏慈善基金会",
    nsfcProject: "国家自然科学基金青年学生基础研究项目",
    grantNumber: "批准号：123B026",
    grantPeriod: "执行期：2023–2025",
    nsfc: "国家自然科学基金委员会 ↗",
    wechatLabel: "微信公众号",
  },
  en: {
    title: "Bugonia | Personal Homepage",
    description: "Xiaoqiu Zhong's personal homepage featuring research, experience, and other work.",
    navigation: "Primary navigation",
    languageSelector: "Language selection",
    avatarAlt: "Bugonia's GitHub avatar",
    displayName: "Xiaoqiu Zhong",
    navAbout: "About",
    navPapers: "Paper",
    navRecognition: "Honors & Funding",
    navLinks: "Links",
    paperSortLabel: "Paper sorting",
    linksSortLabel: "Recommended link sorting",
    visitorsTitle: "Visitor map",
    visitorsDescription: "Where recent visitors came from",
    visitorMapTitle: "Geographic distribution of homepage visitors",
    sortByYear: "Year",
    sortDefault: "Default",
    sortPopular: "Popular",
    interactiveTool: "Interactive tool ↗",
    equalContribution: "* Equal contribution",
    correspondingAuthor: "† Corresponding author",
    alphabeticalOrder: "‡ Authors listed alphabetically by name",
    recognitionTitle: "Honors & Funding",
    awardsTitle: "Awards",
    fundingTitle: "Funding",
    wuScholarship: "Wen-Tsun Wu Scholarship",
    sjtuMath: "School of Mathematical Sciences, SJTU ↗",
    weichaiScholarship: "Weichai Power Scholarship",
    weichaiPower: "Weichai Power Co., Ltd. ↗",
    tungScholarship: "Tung Scholarship",
    tungFoundation: "Hong Kong Tung Foundation",
    nsfcProject: "NSFC Young Student Basic Research Project",
    grantNumber: "Grant No. 123B026",
    grantPeriod: "Project period: 2023–2025",
    nsfc: "National Natural Science Foundation of China ↗",
    wechatLabel: "WeChat account",
  },
};

const languageButtons = document.querySelectorAll("[data-language]");
const descriptionMeta = document.querySelector('meta[name="description"]');
const ogDescriptionMeta = document.querySelector('meta[property="og:description"]');

const setLanguage = (language) => {
  const locale = translations[language] ? language : "zh";
  const copy = translations[locale];

  document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  document.title = copy.title;
  descriptionMeta?.setAttribute("content", copy.description);
  ogDescriptionMeta?.setAttribute("content", copy.description);

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = copy[element.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    element.setAttribute("aria-label", copy[element.dataset.i18nAriaLabel]);
  });
  document.querySelectorAll("[data-i18n-alt]").forEach((element) => {
    element.setAttribute("alt", copy[element.dataset.i18nAlt]);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    element.setAttribute("title", copy[element.dataset.i18nTitle]);
  });
  languageButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.language === locale));
  });

  localStorage.setItem("preferred-language", locale);
};

languageButtons.forEach((button) => {
  button.addEventListener("click", () => setLanguage(button.dataset.language));
});

const savedLanguage = localStorage.getItem("preferred-language");
const initialLanguage = savedLanguage || (navigator.language.startsWith("zh") ? "zh" : "en");
setLanguage(initialLanguage);

const popularityGroups = {
  publications: {
    container: document.querySelector(".publication-list"),
    itemSelector: ".publication",
  },
  links: {
    container: document.querySelector(".recommended-links"),
    itemSelector: ".recommended-link",
  },
};

Object.values(popularityGroups).forEach(({ container, itemSelector }) => {
  container?.querySelectorAll(itemSelector).forEach((item, index) => {
    item.dataset.originalOrder = String(index);
  });
});

let popularityPromise;
const loadPopularity = () => {
  if (popularityPromise) return popularityPromise;

  const items = document.querySelectorAll("[data-popularity-key]");
  popularityPromise = Promise.all(Array.from(items, async (item) => {
    const key = item.dataset.popularityKey;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
      const response = await fetch(`https://bugonia.goatcounter.com/counter/${encodeURIComponent(key)}.json`, {
        signal: controller.signal,
      });
      if (!response.ok) return;
      const data = await response.json();
      item.dataset.clickCount = String(Number(String(data.count).replaceAll(",", "")) || 0);
    } catch {
      item.dataset.clickCount = "0";
    } finally {
      clearTimeout(timeout);
    }
  }));

  return popularityPromise;
};

const sortGroup = async (target, mode) => {
  const group = popularityGroups[target];
  if (!group?.container) return;

  document.querySelectorAll(`[data-sort-target="${target}"]`).forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.sortMode === mode));
  });

  if (mode === "popular") await loadPopularity();

  const items = Array.from(group.container.querySelectorAll(group.itemSelector));
  items.sort((left, right) => {
    if (mode === "popular") {
      const countDifference = Number(right.dataset.clickCount || 0) - Number(left.dataset.clickCount || 0);
      if (countDifference !== 0) return countDifference;
    }
    return Number(left.dataset.originalOrder) - Number(right.dataset.originalOrder);
  });
  items.forEach((item) => group.container.append(item));
};

document.querySelectorAll("[data-sort-target]").forEach((button) => {
  button.addEventListener("click", () => sortGroup(button.dataset.sortTarget, button.dataset.sortMode));
});
