import {
  updateBlockSchema,
  scheduleBlockSchema,
  deleteBlockSchema,
  useArchitectSchema,
} from "@shared";

export const tools = {
  useArchitect: useArchitectSchema,
  deleteBlock: deleteBlockSchema,
  updateBlock: updateBlockSchema,
  scheduleBlock: scheduleBlockSchema,
};
