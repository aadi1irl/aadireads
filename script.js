
const API_URL = "https://graphql.anilist.co";

const mangaGrid = document.getElementById("mangaGrid");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const statusText = document.getElementById("status");
const loadMoreButton = document.getElementById("loadMoreButton");

let currentPage = 1;
let currentSearch = "";
let currentSort = "POPULARITY_DESC";
let isLoading = false;

const query = `
    query (
        $page: Int,
        $perPage: Int,
        $search: String,
        $sort: [MediaSort]
    ) {
        Page(page: $page, perPage: $perPage) {
            pageInfo {
                hasNextPage
            }

            media(
                search: $search,
                type: MANGA,
                sort: $sort,
                isAdult: false
            ) {
                id

                title {
                    english
                    romaji
                }

                coverImage {
                    large
                }

                description(asHtml: false)
                genres
                averageScore
                status
                format
                siteUrl
            }
        }
    }
`;

async function fetchManga(page = 1, append = false) {

    if (isLoading) return;

    isLoading = true;
    searchButton.disabled = true;
    loadMoreButton.disabled = true;

    statusText.textContent = "Loading manga...";

    try {

        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },

            body: JSON.stringify({
                query: query,

                variables: {
                    page: page,
                    perPage: 20,
                    search: currentSearch || null,
                    sort: [currentSort]
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        const pageData = result.data.Page;

        if (!append) {
            mangaGrid.innerHTML = "";
        }

        displayManga(pageData.media);

        statusText.textContent =
            `Page ${page} · ${pageData.media.length} results`;

        loadMoreButton.style.display =
            pageData.pageInfo.hasNextPage ? "block" : "none";

        currentPage = page;

    } catch (error) {

        console.error(error);

        statusText.textContent = "Unable to load manga.";

        if (!append) {
            mangaGrid.innerHTML =
                "<p>Something went wrong. Please try again.</p>";
        }

    } finally {

        isLoading = false;
        searchButton.disabled = false;
        loadMoreButton.disabled = false;

    }
}

function displayManga(mangaList) {

    mangaList.forEach(manga => {

        const title =
            manga.title.english ||
            manga.title.romaji ||
            "Unknown Title";

        const cover =
            manga.coverImage?.large || "";

        const card = document.createElement("article");
        card.className = "manga-card";

        const image = document.createElement("img");
        image.className = "manga-cover";
        image.src = cover;
        image.alt = title;
        image.loading = "lazy";

        image.onerror = () => {
            image.removeAttribute("src");
            image.alt = "Cover unavailable";
        };

        const info = document.createElement("div");
        info.className = "manga-info";

        const heading = document.createElement("h3");
        heading.textContent = title;

        const genre = document.createElement("p");
        genre.textContent =
            manga.genres.slice(0, 2).join(" • ") || "Manga";

        const score = document.createElement("p");
        score.className = "manga-score";
        score.textContent =
            manga.averageScore
                ? `★ ${manga.averageScore}%`
                : "Not rated";

        const link = document.createElement("a");
        link.className = "manga-link";
        link.href = manga.siteUrl;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "View on AniList ↗";

        info.append(heading, genre, score, link);

        card.append(image, info);

        mangaGrid.appendChild(card);

    });
}

function searchManga() {

    currentSearch = searchInput.value.trim();

    fetchManga(1, false);

}

searchButton.addEventListener("click", searchManga);

searchInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        searchManga();
    }

});

loadMoreButton.addEventListener("click", () => {

    fetchManga(currentPage + 1, true);

});

document.querySelectorAll(".filter-btn").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".filter-btn").forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");

        currentSort = button.dataset.sort;

        fetchManga(1, false);

    });

});

document.querySelectorAll("[data-search]").forEach(button => {

    button.addEventListener("click", () => {

        searchInput.value = button.dataset.search;

        searchManga();

    });

});

// Load popular manga when the website opens.
fetchManga();
