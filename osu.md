---
layout: page
title: My osu! Stats
permalink: /osu
---

<div class="container">
    <table>
        <tr>
            <td><strong>Username:</strong></td>
            <td><a id="username" href="https://osu.ppy.sh/users/12881756" target="_blank"></a></td>
        </tr>
        <tr>
            <td><strong>Global Rank:</strong></td>
            <td><span id="pp_rank"></span></td>
        </tr>
        <tr>
            <td><strong>Level:</strong></td>
            <td><span id="level"></span></td>
        </tr>
        <tr>
            <td><strong>pp:</strong></td>
            <td><span id="pp_raw"></span></td>
        </tr>
        <tr>
            <td><strong>Accuracy:</strong></td>
            <td><span id="accuracy"></span>%</td>
        </tr>
        <tr>
            <td><strong>Play Count:</strong></td>
            <td><span id="playcount"></span></td>
        </tr>
    </table>
    <div id="loading">Loading...</div>
    <div id="error" style="display: none; color: red;">Error fetching data. Please try again later.</div>
</div>

<script>
    async function fetchData() {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        try {
            const response = await fetch('https://osu-profile-fetcher.learningis1st.workers.dev');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();

            const userData = data[0];
            const fields = ['username', 'pp_rank', 'level', 'pp_raw', 'accuracy', 'playcount'];

            fields.forEach(field => {
                const element = document.getElementById(field);
                if (field === 'accuracy') {
                    element.textContent = Number(userData.accuracy).toFixed(2);
                } else {
                    element.textContent = userData[field];
                }
            });

            loadingElement.style.display = 'none';
        } catch (error) {
            console.error('Error fetching data:', error);
            errorElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    fetchData();
</script>
