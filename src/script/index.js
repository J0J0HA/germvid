import { watch } from "./watch.js";
import { videomng } from "./videomng.js";
import { getSearchParam } from "./util.js";

let current_lang = 'en';

document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname === '/watch.html') {
        watch();
    } else {
        index();
    }
});

function matches_filter(filter, video, vid, check_lang) {
    if (!check_lang) {
        check_lang = current_lang;
    }

    if (filter.startsWith('!')) {
        return !matches_filter(filter.substring(1), video, vid, check_lang);
    }

    if (filter.indexOf('|') != -1) {
        let [filter_a, ...filter_b] = filter.split('|');
        return matches_filter(filter_a, video, vid, check_lang) || matches_filter(filter_b.join("|"), video, vid, check_lang);
    }

    if (filter.indexOf('&') != -1) {
        let [filter_a, ...filter_b] = filter.split('&');
        return matches_filter(filter_a, video, vid, check_lang) && matches_filter(filter_b.join("&"), video, vid, check_lang);
    }

    if (filter.startsWith('~')) {
        let [lang, ...new_filter] = filter.substring(1).split(':');
        return (video.getLanguageList().indexOf(lang) != -1) && matches_filter(new_filter.join(":"), video, vid, lang);
    }

    if (filter.startsWith('series:')) {
        return video.getSeries(check_lang).toLowerCase().includes(filter.substring(7).toLowerCase());
    }
    if (filter.startsWith('author:')) {
        return video.getAuthor(check_lang).toLowerCase().includes(filter.substring(7).toLowerCase());
    }
    if (filter.startsWith('title:')) {
        return video.getTitle(check_lang).toLowerCase().includes(filter.substring(6).toLowerCase());
    }

    if (filter.startsWith('series=')) {
        return video.getSeries(check_lang).toLowerCase() == filter.substring(7).toLowerCase();
    }
    if (filter.startsWith('author=')) {
        return video.getAuthor(check_lang).toLowerCase() == filter.substring(7).toLowerCase();
    }
    if (filter.startsWith('title=')) {
        return video.getTitle(check_lang).toLowerCase() == filter.substring(6).toLowerCase();
    }

    if (filter.startsWith('id=')) {
        return vid == filter.substring(3);
    }

    return video.getTitle(check_lang).toLowerCase().includes(filter.toLowerCase())
        || video.getAuthor(check_lang).toLowerCase().includes(filter.toLowerCase())
        || video.getSeries(check_lang).toLowerCase().includes(filter.toLowerCase())
        || filter.includes(vid)
}

function renderList(filter = null) {
    document.querySelector("#videos").innerText = "";
    for (let vid of Object.keys(videomng.data)) {
        let video = videomng.getVideo(vid);

        if (filter) {
            if (!matches_filter(filter, video, vid)) {
                continue;
            }
        }

        let video_elm = document.createElement('tr');
        video_elm.classList.add('video');
        let title_elm = document.createElement('td');
        title_elm.innerText = video.getTitle(current_lang);
        video_elm.appendChild(title_elm);
        let author_elm = document.createElement('td');
        let author_link_elm = document.createElement('a');
        author_link_elm.innerText = video.getAuthor(current_lang);
        author_link_elm.href = video.getAuthorUrl();
        author_elm.appendChild(author_link_elm);
        video_elm.appendChild(author_elm);
        let series_elm = document.createElement('td');
        series_elm.innerText = video.getSeries(current_lang);
        video_elm.appendChild(series_elm);
        let languages_elm = document.createElement('td');
        let langlist = [];
        for (let lang of video.getLanguageList()) {
            if (lang === current_lang) {
                langlist.push("<b>" + lang + "</b>");
            } else {
                langlist.push(lang);
            }
        }
        languages_elm.innerHTML = langlist.join(', ');
        video_elm.appendChild(languages_elm);
        let action_elm = document.createElement('td');
        let link_elm = document.createElement('a');
        link_elm.innerText = `Watch (for ${current_lang})`;
        link_elm.href = `/watch.html?v=${vid}&lang=${current_lang}`;
        action_elm.appendChild(link_elm);
        video_elm.appendChild(action_elm);
        document.querySelector("#videos").appendChild(video_elm);
    }
}

function updateList() {
    let filter = document.querySelector("#search").value;
    renderList(filter);
}

async function index() {
    await videomng.init();
    current_lang = getSearchParam('lang');
    if (current_lang === null) {
        current_lang = 'en';
    }

    document.querySelector("#search").addEventListener('keyup', updateList);
    document.querySelector("#search").addEventListener('keydown', updateList);

    updateList();
}