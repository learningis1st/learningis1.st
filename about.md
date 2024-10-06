---
layout: base
title: About Me
permalink: /about
---

# Yijia Chen

### Education
- Gonzaga University, Spokane, WA
  - B.A. in Computer Science & Computational Thinking, Economics Concentration

### Skills
- Linux System Administration (SysOp)
- Programming Languages: Python, C++, Java
- Shell Scripting

### Languages
- Mandarin Chinese (Native)
- English (Fluent)
- Japanese (Conversational)

<img src="/images/learningis1st_about_me.webp" alt="My hobbies and fields of interest" />

<script>
async function fetchOsuRankData() {
  const response = await fetch('https://osu-profile-fetcher.learningis1st.workers.dev/learningis1st');
  if (!response.ok) {
    throw new Error('Failed to fetch osu! rank data');
  }
  return response.json();
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await fetchOsuRankData();
    const ppRank = data[0].pp_rank;
    const osuProfileLink = `https://osu.ppy.sh/users/12881756`;
    
    const rankElement = document.getElementById('ppRank');
    rankElement.innerHTML = `<a href="${osuProfileLink}" target="_blank">${ppRank}</a>`;

    document.getElementById('osuRankSection').style.display = 'block';
  } catch (error) {
    console.error(error);
    document.getElementById('osuRankSection').style.display = 'none';
  }
});
</script>

<div id="osuRankSection" style="display: none;">
  <p>My <span style="color: pink;">osu!</span> global ranking is: <span id="ppRank"></span></p>
</div>
