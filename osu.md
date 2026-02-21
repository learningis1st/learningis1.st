---
layout: page
title: My osu! Stats
permalink: /osu
---

<div class="container">
    <table>
        <tr>
            <td><strong>Username:</strong></td>
            <td><a id="username" target="_blank"></a></td>
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
            <td><span id="accuracy"></span></td>
        </tr>
        <tr>
            <td><strong>Play Count:</strong></td>
            <td><span id="playcount"></span></td>
        </tr>
    </table>
    <div id="loading" aria-live="polite">Loading...</div>
    <div id="error" style="display: none; color: red;" aria-live="assertive">Error fetching data. Please try again later.</div>
</div>

<script>
    async function fetchData(username) {
        const loadingElement = document.getElementById('loading');
        const errorElement = document.getElementById('error');
        loadingElement.style.display = 'block';
        errorElement.style.display = 'none';

        try {
            const response = await fetch(`https://osu-profile-fetcher.learningis1st.workers.dev/${username}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const userData = data[0];

            const usernameElement = document.getElementById('username');
            const profileUrl = `https://osu.ppy.sh/users/${userData.user_id}`;
            usernameElement.textContent = userData.username || '';
            usernameElement.href = profileUrl;

            const fields = {
                pp_rank: userData.pp_rank,
                level: userData.level ? Math.round(userData.level) : '',
                pp_raw: userData.pp_raw,
                accuracy: userData.accuracy ? Number(userData.accuracy).toFixed(2) + '%' : '',
                playcount: userData.playcount
            };

            Object.keys(fields).forEach(field => {
                const element = document.getElementById(field);
                element.textContent = fields[field] || '';
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            errorElement.style.display = 'block';
        } finally {
            loadingElement.style.display = 'none';
        }
    }

    const username = 'learningis1st';
    fetchData(username);
</script>
