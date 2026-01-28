import {
  getWeatherInformationSchema,
  getLocalTimeSchema,
  scheduleTaskSchema,
  getScheduledTasksSchema,
  cancelScheduledTaskSchema,
  addToBacklogSchema,
  scheduleBlockSchema,
  updateTaskSchema,
  deleteTaskSchema,
} from "../shared";

export const tools = {
  getWeatherInformation: getWeatherInformationSchema,
  getLocalTime: getLocalTimeSchema,
  scheduleTask: scheduleTaskSchema,
  getScheduledTasks: getScheduledTasksSchema,
  cancelScheduledTask: cancelScheduledTaskSchema,
  addToBacklog: addToBacklogSchema,
  scheduleBlock: scheduleBlockSchema,
  updateTask: updateTaskSchema,
  deleteTask: deleteTaskSchema,
};
