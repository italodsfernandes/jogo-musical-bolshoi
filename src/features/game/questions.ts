import { Question } from "@/features/game/types";

export const QUESTIONS: Question[] = [
  {
    id: "villa-lobos-bachianas-5",
    composer: "Heitor Villa-Lobos",
    music: "Bachianas Brasileiras No. 5",
    audioSrc: "/audio/villa-lobos-bachianas-brasileiras-no-5.mp3",
  },
  {
    id: "pachelbel-canon-d",
    composer: "Johann Pachelbel",
    music: "Canon in D Major",
    audioSrc: "/audio/pachelbel-canon-in-d-major.mp3",
  },
  {
    id: "ravel-bolero",
    composer: "Maurice Ravel",
    music: "Boléro",
    audioSrc: "/audio/ravel-bolero.mp3",
  },
  {
    id: "tchaikovsky-piano-concerto-1",
    composer: "P.I. Tchaikovski",
    music: "Piano Concerto No. 1 in B-flat minor",
    audioSrc: "/audio/tchaikovsky-piano-concerto-no-1.mp3",
  },
  {
    id: "vivaldi-winter-rv297",
    composer: "Antonio Vivaldi",
    music: "Winter - 4 Estações",
    audioSrc: "/audio/vivaldi-four-seasons-winter-rv297.mp3",
  },
  {
    id: "saint-saens-the-swan",
    composer: "Camille Saint-Saëns",
    music: "O Cisne – O Carnaval dos Animais",
    audioSrc: "/audio/saint-saens-the-swan.mp3",
  },
  {
    id: "beethoven-symphony-9",
    composer: "Ludwig van Beethoven",
    music: "Sinfonia No. 9",
    audioSrc: "/audio/beethoven-symphony-no-9.mp3",
  },
  {
    id: "orff-o-fortuna",
    composer: "Carl Orff",
    music: "O Fortuna – Carmina Burana",
    audioSrc: "/audio/orff-o-fortuna-carmina-burana.mp3",
  },
  {
    id: "mozart-eine-kleine-nachtmusik",
    composer: "Mozart",
    music: "Eine kleine Nachtmusik",
    audioSrc: "/audio/mozart-eine-kleine-nachtmusik.mp3",
  },
  {
    id: "tchaikovsky-lake-of-swans",
    composer: "P.I. Tchaikovski",
    music: "O Lago dos Cisnes – Suite (Scene I)",
    audioSrc: "/audio/tchaikovsky-lake-of-the-swans.mp3",
  },
];

export const QUESTIONS_BY_ID = new Map(
  QUESTIONS.map((question) => [question.id, question])
);

export const QUESTION_IDS = QUESTIONS.map((question) => question.id);
