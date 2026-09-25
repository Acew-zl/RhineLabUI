/** Build-time host selection; extension pages never register the website PWA. */
export const isChromeStore = import.meta.env.MODE === "extension-chrome";
export const isExtension = import.meta.env.MODE === "extension" || isChromeStore;
