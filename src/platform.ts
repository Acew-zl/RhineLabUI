/** Build-time host selection; extension pages never register the website PWA. */
export const isExtension = import.meta.env.MODE === "extension";
