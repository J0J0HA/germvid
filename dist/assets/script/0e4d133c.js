/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

;// CONCATENATED MODULE: ./src/script/videomng.js
class Subtitles {
    // project representing subtitle data
    constructor(data) {
        this.data = data;
    }

    getSubtitleText() {
        return this.data.subtitles;
    }

    getLines() {
        return Object.keys(this.data.lines);
    }

    getLine(id) {
        return this.data.lines[id];
    }

    getLineName(id) {
        return this.getLine(id).name;
    }

    getLineHideIfUnused(id) {
        return this.getLine(id).hideIfUnused;
    }

    getLineShowRecentLines(id) {
        return this.getLine(id).showRecentLines;
    }

    getTextAt(timestamp) {
        let lines = this.getLines();
        let subtitles = this.getSubtitleText();
        let output = {};

        for (let segment of subtitles) {
            if (segment.from <= timestamp && timestamp <= segment.to) {
                for (let line of this.getLines()) {
                    if (segment.lines[line] !== undefined) {
                        output[line] = segment.lines[line];
                    }
                }
            }
        }

        for (let line of this.getLines()) {
            if (output[line] === undefined && !this.getLineHideIfUnused(line)) {
                output[line] = '/';
            }
        }

        return output;
    }
}

class Video {
    constructor(id, languages, channel) {
        this.id = id;
        this.languages = languages;
        this.channel = channel;
    }

    getLanguage(lang) {
        return this.languages[lang];
    }

    getLanguageList() {
        return Object.keys(this.languages);
    }

    getTitle(lang) {
        return this.getLanguage(lang).title;
    }

    getSubtitleURL(lang) {
        return this.getLanguage(lang).subtitles;
    }

    async getSubtitles(lang) {
        if (!this.getSubtitleURL(lang)) {
            return new Subtitles({
                subtitles: [{
                    from: 0,
                    to: 1000,
                    lines: {
                        notice: "No subtitles available."
                    }
                }],
                lines: {
                    notice: {
                        name: "Notice",
                        hideIfUnused: false,
                    }
                }
            });
        }
        let res = await window.fetch(this.getSubtitleURL(lang));
        let json = await res.json();
        return new Subtitles(json);
    }

    getSeries(lang) {
        return this.getLanguage(lang).series;
    }

    getAuthor(lang) {
        return this.getLanguage(lang).author;
    }
}

let videomng = {
    data: null,
    init: async function () {
        this.data = await window.fetch('/data/videolist.json').then(res => res.json());
    },
    getVideo: function (id) {
        let video_data = this.data[id];
        if (video_data === undefined) {
            return null;
        }
        return new Video(id, video_data.languages, video_data.channel);
    },
}

window.videomng = videomng;

;// CONCATENATED MODULE: ./src/script/util.js
function getSearchParam(key) {
    let params = new URLSearchParams(window.location.search);
    return params.get(key);
}
;// CONCATENATED MODULE: ./src/script/watch.js



function renderSubtitlesAt(subtitles_obj, timestamp) {
    let subtitles_elm = document.querySelector("#subtitles");
    subtitles_elm.innerHTML = '';
    let text = subtitles_obj.getTextAt(timestamp);
    for (let line of Object.keys(text)) {
        let line_elm = document.createElement('tr');
        let name_elm = document.createElement('td');
        let text_elm = document.createElement('td');
        name_elm.innerText = subtitles_obj.getLineName(line);
        name_elm.classList.add('min');
        text_elm.innerText = text[line];
        line_elm.appendChild(name_elm);
        line_elm.appendChild(text_elm);
        subtitles_elm.appendChild(line_elm);
    }
}

async function watch() {
    await videomng.init();
    let vid = getSearchParam('v');
    let video = videomng.getVideo(vid);
    if (video === null) {
        alert('Video not found!');
        window.location.href = '/';
        return;
    }
    let lang = getSearchParam('lang');
    if (lang === null) {
        lang = 'en';
    }
    let title = video.getTitle(lang);
    document.title = title + ' - Germvid';
    document.querySelector("h2").innerText = title;
    let author = video.getAuthor(lang);
    document.querySelector("#author").innerText = author;
    let series = video.getSeries(lang);
    document.querySelector("#series").innerText = series;

    let subtitles = await video.getSubtitles(lang);

    let tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    let firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    let player;
    function onYouTubeIframeAPIReady() {
        player = new YT.Player('video-player', {
            videoId: vid,
            events: {
                'onReady': onPlayerReady
            }
        });
    }

    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

    function onPlayerReady(event) {
        event.target.playVideo();
        setInterval(function () {
            let timestamp = player.getCurrentTime();
            renderSubtitlesAt(subtitles, timestamp)
        }, 100);
        document.querySelector("header").classList.add("hidden");
    }
}

;// CONCATENATED MODULE: ./src/script/index.js




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
        author_link_elm.href = `https://youtube.com/@${video.channel}`;
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
/******/ })()
;