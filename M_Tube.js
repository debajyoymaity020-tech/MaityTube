const API_KEY = "AIzaSyBJLO6lUPxCGv2xyBy6wTSHWoiudJHHt8M";

const categories = [
    "All", "Trending", "Music",
    "Gaming", "Learning", "News"
];

const grid = document.getElementById("grid");
const chipsBox = document.getElementById("chips");
const emptyMsg = document.getElementById("empty");
const resultHd = document.getElementById("resultHead");
const form = document.getElementById("searchForm");
const input = document.getElementById("q");
const menuBtn = document.getElementById("menuBtn");
const scrim = document.getElementById("scrim");
const sideLinks = document.querySelectorAll(".sb nav a[data-cat]");
const modal = document.getElementById("player");
const pClose = document.getElementById("pClose");
const pScreen = document.getElementById("pScreen");
const pTitle = document.getElementById("pTitle");
const pMeta = document.getElementById("pMeta");

let activeCat = "All";
let videos = [];
let lastFocus = null;
let requestNumber = 0;

const categoryQueries = {
    All: "popular videos",
    Trending: "trending videos India",
    Music: "popular music",
    Gaming: "gaming videos",
    Learning: "programming tutorials",
    News: "India news"
};

function closeMobileMenu() {
    document.body.classList.remove("sb-open");
}

function isMobile() {
    return window.matchMedia("(max-width:900px)").matches;
}

function showMessage(message) {
    grid.replaceChildren();
    emptyMsg.hidden = false;
    emptyMsg.textContent = message;
}

function makeCard(video) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "card";

    const thumb = document.createElement("div");
    thumb.className = "thumb";

    const image = document.createElement("img");
    image.src = video.thumbnail;
    image.alt = "";
    image.loading = "lazy";
    image.style.cssText =
        "width:100%;height:100%;object-fit:cover;position:absolute;inset:0";

    const play = document.createElement("span");
    play.className = "play";
    play.innerHTML =
        '<svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">' +
        '<path d="M8 5v14l11-7z"/></svg>';

    thumb.append(image, play);

    const info = document.createElement("div");
    info.className = "info";

    const avatar = document.createElement("div");
    avatar.className = "ch-av";
    avatar.textContent =
        (video.channel || "?").charAt(0).toUpperCase();

    const text = document.createElement("div");

    const title = document.createElement("div");
    title.className = "t";
    title.textContent = video.title;

    const meta = document.createElement("div");
    meta.className = "m";
    meta.textContent = video.channel;

    text.append(title, meta);
    info.append(avatar, text);
    card.append(thumb, info);

    card.addEventListener("click", () => openPlayer(video));

    return card;
}

function render() {
    grid.replaceChildren();

    videos.forEach(video => {
        grid.appendChild(makeCard(video));
    });

    emptyMsg.hidden = videos.length !== 0;

    chipsBox.querySelectorAll(".chip").forEach(chip => {
        chip.classList.toggle(
            "on",
            chip.dataset.cat === activeCat
        );
    });

    sideLinks.forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.cat === activeCat
        );
    });
}

async function searchVideos(searchTerm) {
    const term = searchTerm.trim();

    if (!term) {
        showMessage("Please enter a video name.");
        return;
    }

    if (
        !API_KEY ||
        API_KEY === "YOUR_API_KEY_HERE"
    ) {
        showMessage("প্রথমে M_Tube.js-এ নিজের API key বসাও।");
        return;
    }

    const thisRequest = ++requestNumber;

    resultHd.hidden = false;
    resultHd.textContent = `Results for "${term}"`;
    showMessage("Loading YouTube videos...");

    const params = new URLSearchParams({
        part: "snippet",
        type: "video",
        maxResults: "24",
        q: term,
        regionCode: "IN",
        videoEmbeddable: "true",
        key: API_KEY
    });

    try {
        const response = await fetch(
            "https://www.googleapis.com/youtube/v3/search?" +
            params.toString()
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "YouTube API request failed"
            );
        }

        if (thisRequest !== requestNumber) return;

        videos = (data.items || [])
            .filter(item => item.id?.videoId)
            .map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                thumbnail:
                    item.snippet.thumbnails?.high?.url ||
                    item.snippet.thumbnails?.medium?.url ||
                    item.snippet.thumbnails?.default?.url,
                publishedAt: item.snippet.publishedAt
            }))
            .filter(video => video.thumbnail);

        render();

        if (videos.length === 0) {
            showMessage("কোনও ভিডিও পাওয়া যায়নি। অন্য শব্দ দিয়ে সার্চ করো।");
        }
    } catch (error) {
        if (thisRequest !== requestNumber) return;

        console.error(error);
        showMessage("ভিডিও লোড হয়নি: " + error.message);
    }
}

// Category chips
categories.forEach(category => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.dataset.cat = category;
    button.textContent = category;

    button.addEventListener("click", () => {
        activeCat = category;
        closeMobileMenu();
        input.value = category === "All"
            ? ""
            : categoryQueries[category];

        searchVideos(
            category === "All"
                ? categoryQueries.All
                : categoryQueries[category]
        );
        render();
    });

    chipsBox.appendChild(button);
});

// Sidebar
sideLinks.forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();

        const category = link.dataset.cat;
        if (!category) return;

        activeCat = category;
        input.value = categoryQueries[category] || "";

        closeMobileMenu();

        searchVideos(categoryQueries[category] || "popular videos");
        render();
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
});

// Search only on submit, not on every keystroke
form.addEventListener("submit", event => {
    event.preventDefault();
    activeCat = "All";
    searchVideos(input.value);
    input.blur();
    render();
});

document.addEventListener("keydown", event => {
    const typing = /^(INPUT|TEXTAREA)$/.test(
        document.activeElement.tagName
    );

    if (event.key === "/" && !typing) {
        event.preventDefault();
        input.focus();
    }

    if (event.key === "Escape" && !modal.hidden) {
        closePlayer();
    }
});

// Sidebar toggle
menuBtn.addEventListener("click", () => {
    if (isMobile()) {
        document.body.classList.toggle("sb-open");
    } else {
        document.body.classList.toggle("sb-hidden");
    }
});

scrim.addEventListener("click", closeMobileMenu);

// YouTube embedded player
function openPlayer(video) {
    lastFocus = document.activeElement;

    pTitle.textContent = video.title;
    pMeta.textContent = video.channel;

    const iframe = document.createElement("iframe");
    iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(video.id) +
        "?autoplay=1";

    iframe.title = video.title;
    iframe.allow =
        "accelerometer; autoplay; clipboard-write; " +
        "encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    pScreen.replaceChildren(iframe);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    pClose.focus();
}

function closePlayer() {
    modal.hidden = true;
    document.body.style.overflow = "";

    // Stop video playback when closing the modal
    pScreen.replaceChildren();

    if (lastFocus) lastFocus.focus();
}

pClose.addEventListener("click", closePlayer);

modal.addEventListener("click", event => {
    if (event.target === modal) closePlayer();
});

// Initial results
searchVideos("popular music");
