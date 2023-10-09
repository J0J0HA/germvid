import { videomng } from './videomng.js';
import { getSearchParam } from './util.js';

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

export async function watch() {
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
