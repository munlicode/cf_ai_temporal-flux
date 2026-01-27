import {
  getWeatherInformationSchema,
  getLocalTimeSchema,
  scheduleTaskSchema,
  getScheduledTasksSchema,
  cancelScheduledTaskSchema,
} from "@flux/shared";

export const tools = {
  getWeatherInformation: getWeatherInformationSchema,
  getLocalTime: getLocalTimeSchema,
  scheduleTask: scheduleTaskSchema,
  getScheduledTasks: getScheduledTasksSchema,
  cancelScheduledTask: cancelScheduledTaskSchema,
};
