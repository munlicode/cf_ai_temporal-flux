import {
  updateBlockSchema,
  scheduleBlockSchema,
  deleteBlockSchema,
  useArchitectSchema,
  createPlanSchema,
  switchPlanSchema,
  listPlansSchema,
  deletePlanSchema,
} from "@shared";

export const tools = {
  useArchitect: useArchitectSchema,
  deleteBlock: deleteBlockSchema,
  updateBlock: updateBlockSchema,
  scheduleBlock: scheduleBlockSchema,
  createPlan: createPlanSchema,
  switchPlan: switchPlanSchema,
  listPlans: listPlansSchema,
  deletePlan: deletePlanSchema,
};
