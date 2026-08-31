export const FACTORY_STAGES = [
  "Тема",
  "Сценарий",
  "Сцены",
  "Кадры",
  "Изображения",
  "Озвучка",
  "Монтаж",
  "MP4",
] as const;

export const IMAGES_STAGE_INDEX = FACTORY_STAGES.indexOf("Изображения");
export const IMAGES_STAGE_PROGRESS = IMAGES_STAGE_INDEX / (FACTORY_STAGES.length - 1);
