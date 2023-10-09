export class Subtitles {
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

export class Video {
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

export let videomng = {
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
