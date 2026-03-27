export const SITE_NAME = "MusiQuiz Piano Day";
export const BRAND_NAME = "Escola do Teatro Bolshoi no Brasil";
export const BOLSHOI_LOGO_URL =
  "https://lirp.cdn-website.com/8c369bb1/dms3rep/multi/opt/logo+Bolshoi+-+selo_color-1920w.png";

export const GAME_CUTOFF = new Date("2026-03-27T09:30:00-03:00").getTime();

export const isGameClosed = (now = Date.now()) => now >= GAME_CUTOFF;
