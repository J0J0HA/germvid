export function getSearchParam(key) {
    let params = new URLSearchParams(window.location.search);
    return params.get(key);
}